import { translateWithMyMemory } from '@/lib/providers/mymemory';
import { translateWithStub } from '@/lib/providers/stub';

export interface TranslateResult {
  translated: string;
  provider: string;
  durationMs: number;
  inputChars: number;
  outputChars: number;
  cost: number;
}

const DEEPL_LANG_MAP: Record<string, string> = {
  en: 'EN',
  ja: 'JA',
  zh: 'ZH',
};

async function translateWithDeepl(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<TranslateResult> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('DEEPL_API_KEY not configured');

  const start = Date.now();
  const targetLang = DEEPL_LANG_MAP[toLang.toLowerCase()] ?? toLang.toUpperCase();

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: fromLang.toUpperCase(),
      target_lang: targetLang,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as { translations: Array<{ text: string }> };
  const translated = data.translations[0]?.text ?? '';
  const durationMs = Date.now() - start;

  return {
    translated,
    provider: 'deepl',
    durationMs,
    inputChars: text.length,
    outputChars: translated.length,
    cost: 0,
  };
}

async function translateWithClaude(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<TranslateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const langNames: Record<string, string> = {
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese (Simplified)',
    ko: 'Korean',
  };

  const start = Date.now();
  const targetLangName = langNames[toLang.toLowerCase()] ?? toLang;
  const sourceLangName = langNames[fromLang.toLowerCase()] ?? fromLang;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate the following ${sourceLangName} text to ${targetLangName}. Return only the translated text without any explanation or notes.\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const translated = data.content.find((b) => b.type === 'text')?.text ?? '';
  const durationMs = Date.now() - start;

  // claude-haiku-4-5 pricing: input $0.80/1M tokens, output $4.00/1M tokens
  const inputCost = (data.usage.input_tokens / 1_000_000) * 0.80;
  const outputCost = (data.usage.output_tokens / 1_000_000) * 4.00;

  return {
    translated,
    provider: 'claude',
    durationMs,
    inputChars: text.length,
    outputChars: translated.length,
    cost: inputCost + outputCost,
  };
}

export async function translate(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<TranslateResult> {
  // Priority: DeepL > Claude > MyMemory (free, no key needed) > Stub
  if (process.env.DEEPL_API_KEY) {
    return translateWithDeepl(text, fromLang, toLang);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return translateWithClaude(text, fromLang, toLang);
  }

  // MyMemory: free translation API, no key required
  try {
    const result = await translateWithMyMemory(text, fromLang, toLang);
    return {
      ...result,
      provider: 'mymemory',
      inputChars: text.length,
      outputChars: result.translated.length,
      cost: 0,
    };
  } catch {
    // Last resort: stub
    const result = await translateWithStub(text, fromLang, toLang);
    return {
      ...result,
      provider: 'stub',
      inputChars: text.length,
      outputChars: result.translated.length,
      cost: 0,
    };
  }
}
