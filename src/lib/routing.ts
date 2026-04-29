import { prisma } from "./prisma";

export interface ResolvedProvider {
  id: string | null;
  name: string; // "deepl" | "claude" | "mymemory" | "stub"
  displayName: string;
  apiKey: string;
  model: string | null;
  supportsBatch: boolean;
  freeQuotaUsed: number;
  freeQuotaLimit: number;
}

const ENV_FALLBACKS: ResolvedProvider[] = [];

function envFallbacks(): ResolvedProvider[] {
  if (ENV_FALLBACKS.length > 0) return ENV_FALLBACKS;

  if (process.env.DEEPL_API_KEY) {
    ENV_FALLBACKS.push({
      id: null,
      name: "deepl",
      displayName: "DeepL Free (env)",
      apiKey: process.env.DEEPL_API_KEY,
      model: null,
      supportsBatch: true,
      freeQuotaUsed: 0,
      freeQuotaLimit: 500_000,
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    ENV_FALLBACKS.push({
      id: null,
      name: "claude",
      displayName: "Claude Haiku (env)",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      supportsBatch: true,
      freeQuotaUsed: 0,
      freeQuotaLimit: 0,
    });
  }

  return ENV_FALLBACKS;
}

// Returns providers in priority order. Skips disabled and quota-exhausted ones.
// MyMemory and stub are always returned at the tail as final fallbacks.
export async function resolveProviderChain(
  charsNeeded: number,
): Promise<ResolvedProvider[]> {
  const chain: ResolvedProvider[] = [];

  try {
    const dbProviders = await prisma.provider.findMany({
      where: { active: true },
      orderBy: [{ isDefault: "desc" }, { priority: "asc" }],
    });

    for (const p of dbProviders) {
      if (!p.apiKey && p.name !== "libretranslate") continue;
      const remaining =
        p.freeQuotaLimit > 0 ? p.freeQuotaLimit - p.freeQuotaUsed : Infinity;
      if (remaining <= 0) continue;
      // Only include if there's enough headroom for the request.
      if (remaining < charsNeeded && p.freeQuotaLimit > 0) continue;

      chain.push({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        apiKey: p.apiKey,
        model: p.model,
        supportsBatch:
          p.supportsBatch || p.name === "deepl" || p.name === "claude",
        freeQuotaUsed: p.freeQuotaUsed,
        freeQuotaLimit: p.freeQuotaLimit,
      });
    }
  } catch {
    // DB unreachable — env-only fallback.
  }

  if (chain.length === 0) chain.push(...envFallbacks());

  // Always-available free tail.
  chain.push({
    id: null,
    name: "mymemory",
    displayName: "MyMemory (free)",
    apiKey: "",
    model: null,
    supportsBatch: false,
    freeQuotaUsed: 0,
    freeQuotaLimit: 0,
  });

  return chain;
}

export async function bumpQuota(
  providerId: string | null,
  charsUsed: number,
): Promise<void> {
  if (!providerId || charsUsed <= 0) return;
  try {
    await prisma.provider.update({
      where: { id: providerId },
      data: { freeQuotaUsed: { increment: charsUsed } },
    });
  } catch {
    // Best-effort.
  }
}
