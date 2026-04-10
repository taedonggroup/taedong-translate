const LANG_MAP: Record<string, string> = {
  ko: "ko",
  en: "en-GB",
  ja: "ja",
  zh: "zh-CN",
};

export async function translateWithMyMemory(
  text: string,
  from: string,
  to: string,
): Promise<{
  translated: string;
  durationMs: number;
}> {
  const start = Date.now();
  const fromCode = LANG_MAP[from] || from;
  const toCode = LANG_MAP[to] || to;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };

  return {
    translated: data.responseData?.translatedText || text,
    durationMs: Date.now() - start,
  };
}
