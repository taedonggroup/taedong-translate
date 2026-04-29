const DEEPL_LANG_MAP: Record<string, string> = {
  en: "EN-US",
  ja: "JA",
  zh: "ZH",
  ko: "KO",
  fr: "FR",
  es: "ES",
  de: "DE",
  ru: "RU",
  pt: "PT-PT",
  it: "IT",
  nl: "NL",
  pl: "PL",
  id: "ID",
};

const DEEPL_BATCH_MAX = 50;
const DEEPL_HARD_LIMIT_CHARS = 30000;

export interface DeeplBatchResult {
  translated: string[];
  durationMs: number;
}

export async function translateBatchDeepl(
  texts: string[],
  fromLang: string,
  toLang: string,
  apiKey: string,
): Promise<DeeplBatchResult> {
  const start = Date.now();
  const targetLang =
    DEEPL_LANG_MAP[toLang.toLowerCase()] ?? toLang.toUpperCase();
  const sourceLang =
    DEEPL_LANG_MAP[fromLang.toLowerCase()]?.split("-")[0] ??
    fromLang.toUpperCase();

  const allResults: string[] = [];

  // Chunk by both count and char total to respect DeepL limits.
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;
  for (const t of texts) {
    if (
      current.length >= DEEPL_BATCH_MAX ||
      currentChars + t.length > DEEPL_HARD_LIMIT_CHARS
    ) {
      if (current.length > 0) chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(t);
    currentChars += t.length;
  }
  if (current.length > 0) chunks.push(current);

  for (const chunk of chunks) {
    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: chunk,
        source_lang: sourceLang,
        target_lang: targetLang,
        preserve_formatting: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DeepL ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      translations: Array<{ text: string }>;
    };
    for (let i = 0; i < chunk.length; i++) {
      allResults.push(data.translations[i]?.text ?? chunk[i]);
    }
  }

  return { translated: allResults, durationMs: Date.now() - start };
}
