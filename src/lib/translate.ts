import { prisma } from "./prisma";
import { lookupMany, writeMany } from "./cache";
import { resolveProviderChain, bumpQuota, ResolvedProvider } from "./routing";
import { translateBatchDeepl } from "./providers/deepl";
import { translateBatchClaude } from "./providers/claude";
import { translateBatchMyMemory } from "./providers/mymemory";
import { translateBatchStub } from "./providers/stub";

export interface TranslateResult {
  translated: string;
  provider: string;
  durationMs: number;
  inputChars: number;
  outputChars: number;
  cost: number;
  cacheHit: boolean;
}

export interface BatchResult {
  translated: string[];
  provider: string;
  durationMs: number;
  inputChars: number;
  outputChars: number;
  cost: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ProviderInvokeResult {
  translated: string[];
  cost: number;
  inputChars: number;
}

async function invokeProvider(
  provider: ResolvedProvider,
  texts: string[],
  fromLang: string,
  toLang: string,
): Promise<ProviderInvokeResult> {
  const inputChars = texts.reduce((s, t) => s + t.length, 0);

  if (provider.name === "deepl") {
    const r = await translateBatchDeepl(
      texts,
      fromLang,
      toLang,
      provider.apiKey,
    );
    return { translated: r.translated, cost: 0, inputChars };
  }

  if (provider.name === "claude" && provider.model) {
    const r = await translateBatchClaude(
      texts,
      fromLang,
      toLang,
      provider.apiKey,
      provider.model,
    );
    return { translated: r.translated, cost: r.cost, inputChars };
  }

  if (provider.name === "mymemory") {
    const r = await translateBatchMyMemory(texts, fromLang, toLang);
    return { translated: r.translated, cost: 0, inputChars };
  }

  // Final fallback.
  const r = await translateBatchStub(texts, fromLang, toLang);
  return { translated: r.translated, cost: 0, inputChars };
}

// Try each provider in the chain until one succeeds. Returns which one served.
async function runChain(
  texts: string[],
  fromLang: string,
  toLang: string,
): Promise<{
  result: ProviderInvokeResult;
  provider: ResolvedProvider;
  errors: string[];
}> {
  const totalChars = texts.reduce((s, t) => s + t.length, 0);
  const chain = await resolveProviderChain(totalChars);
  const errors: string[] = [];

  for (const provider of chain) {
    try {
      const result = await invokeProvider(provider, texts, fromLang, toLang);
      return { result, provider, errors };
    } catch (err) {
      errors.push(`${provider.name}: ${String(err).slice(0, 200)}`);
      // Continue to next provider.
    }
  }

  // Nothing worked — return originals tagged.
  return {
    result: {
      translated: texts.map((t) => `[${toLang.toUpperCase()}] ${t}`),
      cost: 0,
      inputChars: totalChars,
    },
    provider: {
      id: null,
      name: "stub",
      displayName: "Stub",
      apiKey: "",
      model: null,
      supportsBatch: true,
      freeQuotaUsed: 0,
      freeQuotaLimit: 0,
    },
    errors,
  };
}

async function logTranslation(args: {
  siteId?: string | null;
  providerId: string | null;
  fromLang: string;
  toLang: string;
  inputChars: number;
  outputChars: number;
  durationMs: number;
  cost: number;
  cacheHit: boolean;
  success: boolean;
  error?: string;
}): Promise<void> {
  try {
    await prisma.translationLog.create({
      data: {
        siteId: args.siteId ?? null,
        providerId: args.providerId,
        fromLang: args.fromLang,
        toLang: args.toLang,
        inputChars: args.inputChars,
        outputChars: args.outputChars,
        durationMs: args.durationMs,
        cost: args.cost,
        cacheHit: args.cacheHit,
        success: args.success,
        error: args.error,
      },
    });
  } catch {
    // Logging is best-effort.
  }
}

export interface TranslateOptions {
  siteId?: string | null;
  skipCache?: boolean;
}

// Single-text wrapper around the batch path.
export async function translate(
  text: string,
  fromLang: string,
  toLang: string,
  options: TranslateOptions = {},
): Promise<TranslateResult> {
  const r = await translateBatch([text], fromLang, toLang, options);
  return {
    translated: r.translated[0] ?? text,
    provider: r.provider,
    durationMs: r.durationMs,
    inputChars: text.length,
    outputChars: (r.translated[0] ?? "").length,
    cost: r.cost,
    cacheHit: r.cacheHits > 0 && r.cacheMisses === 0,
  };
}

// Core entry point. Always batch-aware.
export async function translateBatch(
  texts: string[],
  fromLang: string,
  toLang: string,
  options: TranslateOptions = {},
): Promise<BatchResult> {
  const start = Date.now();

  if (texts.length === 0) {
    return {
      translated: [],
      provider: "noop",
      durationMs: 0,
      inputChars: 0,
      outputChars: 0,
      cost: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  // Same-language passthrough — never spend quota.
  if (fromLang === toLang) {
    return {
      translated: [...texts],
      provider: "passthrough",
      durationMs: 0,
      inputChars: texts.reduce((s, t) => s + t.length, 0),
      outputChars: texts.reduce((s, t) => s + t.length, 0),
      cost: 0,
      cacheHits: texts.length,
      cacheMisses: 0,
    };
  }

  // 1. Cache lookup.
  const lookups = options.skipCache
    ? texts.map((t) => ({ text: t, translated: null, hash: "" }))
    : await lookupMany(texts, fromLang, toLang);

  const result: string[] = new Array(texts.length).fill("");
  const missIndexes: number[] = [];
  const missTexts: string[] = [];

  for (let i = 0; i < lookups.length; i++) {
    const hit = lookups[i].translated;
    if (hit !== null) {
      result[i] = hit;
    } else if (texts[i].trim().length === 0) {
      // Empty/whitespace-only strings — passthrough, no API call.
      result[i] = texts[i];
    } else {
      missIndexes.push(i);
      missTexts.push(texts[i]);
    }
  }

  let providerName = "cache";
  let providerId: string | null = null;
  let cost = 0;
  let outputChars = 0;
  let inputCharsCharged = 0;

  if (missTexts.length > 0) {
    const { result: chainResult, provider } = await runChain(
      missTexts,
      fromLang,
      toLang,
    );

    providerName = provider.displayName;
    providerId = provider.id;
    cost = chainResult.cost;
    inputCharsCharged = chainResult.inputChars;

    for (let j = 0; j < missIndexes.length; j++) {
      result[missIndexes[j]] = chainResult.translated[j] ?? missTexts[j];
      outputChars += (chainResult.translated[j] ?? "").length;
    }

    // Cache writes (best-effort, don't await).
    if (!options.skipCache && provider.name !== "stub") {
      writeMany(
        missIndexes.map((idx, j) => ({
          text: missTexts[j],
          translated: chainResult.translated[j] ?? missTexts[j],
          fromLang,
          toLang,
          provider: provider.name,
        })),
      ).catch(() => {});
    }

    // Quota bookkeeping.
    bumpQuota(provider.id, inputCharsCharged).catch(() => {});
  } else {
    // 100% cache hit.
    outputChars = result.reduce((s, t) => s + t.length, 0);
  }

  const durationMs = Date.now() - start;
  const totalInput = texts.reduce((s, t) => s + t.length, 0);

  // Async log — don't block.
  logTranslation({
    siteId: options.siteId,
    providerId,
    fromLang,
    toLang,
    inputChars: totalInput,
    outputChars,
    durationMs,
    cost,
    cacheHit: missTexts.length === 0,
    success: true,
  }).catch(() => {});

  return {
    translated: result,
    provider: providerName,
    durationMs,
    inputChars: totalInput,
    outputChars,
    cost,
    cacheHits: texts.length - missTexts.length,
    cacheMisses: missTexts.length,
  };
}
