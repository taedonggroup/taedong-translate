const LANG_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  ko: "Korean",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  fr: "French",
  es: "Spanish",
  de: "German",
  ru: "Russian",
  pt: "Portuguese",
};

export interface ClaudeBatchResult {
  translated: string[];
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const CLAUDE_BATCH_MAX = 30;

// Claude Haiku 4.5 pricing per 1M tokens.
const INPUT_PRICE_PER_M = 0.8;
const OUTPUT_PRICE_PER_M = 4.0;

function buildPrompt(
  texts: string[],
  sourceLangName: string,
  targetLangName: string,
): string {
  return [
    `Translate the following ${sourceLangName} strings to ${targetLangName}.`,
    `Return ONLY a JSON array of translations, in the exact same order, with no explanation.`,
    `Preserve placeholders like {name}, %s, <b>...</b>, line breaks, and punctuation.`,
    `If a string is empty or non-translatable, return it unchanged.`,
    ``,
    `Input JSON array:`,
    JSON.stringify(texts),
  ].join("\n");
}

function extractJsonArray(text: string): string[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    return parsed.map((v) => String(v));
  } catch {
    return null;
  }
}

export async function translateBatchClaude(
  texts: string[],
  fromLang: string,
  toLang: string,
  apiKey: string,
  model: string,
): Promise<ClaudeBatchResult> {
  const start = Date.now();
  const sourceLangName = LANG_NAMES[fromLang.toLowerCase()] ?? fromLang;
  const targetLangName = LANG_NAMES[toLang.toLowerCase()] ?? toLang;

  const allResults: string[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < texts.length; i += CLAUDE_BATCH_MAX) {
    const chunk = texts.slice(i, i + CLAUDE_BATCH_MAX);
    const prompt = buildPrompt(chunk, sourceLangName, targetLangName);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Claude ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    totalInputTokens += data.usage.input_tokens;
    totalOutputTokens += data.usage.output_tokens;

    const raw = data.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = extractJsonArray(raw);

    if (parsed && parsed.length === chunk.length) {
      allResults.push(...parsed);
    } else {
      // Fallback: return originals so the caller still gets a string array.
      allResults.push(...chunk);
    }
  }

  const cost =
    (totalInputTokens / 1_000_000) * INPUT_PRICE_PER_M +
    (totalOutputTokens / 1_000_000) * OUTPUT_PRICE_PER_M;

  return {
    translated: allResults,
    durationMs: Date.now() - start,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    cost,
  };
}
