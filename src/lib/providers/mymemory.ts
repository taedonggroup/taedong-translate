// MyMemory — free public translation API. No key required, but heavily
// rate-limited (≈50K chars/day anonymous, 1M with email). Use only as a
// fallback or for short UI strings where higher-tier providers are unavailable.

const LANG_MAP: Record<string, string> = {
  ko: "ko",
  en: "en-US",
  ja: "ja",
  zh: "zh-CN",
  vi: "vi",
  th: "th",
  id: "id",
  fr: "fr",
  es: "es",
  de: "de",
  ru: "ru",
  pt: "pt",
};

const MM_TIMEOUT_MS = 6000;
const MM_CONCURRENCY = 3;

async function fetchOne(
  text: string,
  fromCode: string,
  toCode: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MM_TIMEOUT_MS);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text,
    )}&langpair=${fromCode}|${toCode}`;
    const res = await fetch(url, { signal: controller.signal });
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    if (data.responseStatus && data.responseStatus !== 200) {
      throw new Error(`MyMemory status ${data.responseStatus}`);
    }
    return data.responseData?.translatedText || text;
  } finally {
    clearTimeout(timer);
  }
}

export async function translateWithMyMemory(
  text: string,
  from: string,
  to: string,
): Promise<{ translated: string; durationMs: number }> {
  const start = Date.now();
  const fromCode = LANG_MAP[from] ?? from;
  const toCode = LANG_MAP[to] ?? to;
  const translated = await fetchOne(text, fromCode, toCode);
  return { translated, durationMs: Date.now() - start };
}

export async function translateBatchMyMemory(
  texts: string[],
  from: string,
  to: string,
): Promise<{ translated: string[]; durationMs: number }> {
  const start = Date.now();
  const fromCode = LANG_MAP[from] ?? from;
  const toCode = LANG_MAP[to] ?? to;

  const result: string[] = new Array(texts.length).fill("");
  let cursor = 0;

  async function worker() {
    while (cursor < texts.length) {
      const i = cursor++;
      try {
        result[i] = await fetchOne(texts[i], fromCode, toCode);
      } catch {
        result[i] = texts[i];
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MM_CONCURRENCY, texts.length) }, () =>
      worker(),
    ),
  );

  return { translated: result, durationMs: Date.now() - start };
}
