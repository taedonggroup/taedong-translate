import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translateBatch } from "@/lib/translate";
import {
  flattenMessages,
  unflattenMessages,
  countStrings,
  MessageObject,
  MessageValue,
} from "@/lib/messages";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface LocaleResult {
  keys: number;
  cacheHits: number;
  cacheMisses: number;
  durationMs: number;
  provider: string;
  success: boolean;
  error?: string;
}

// POST /api/sites/[id]/auto-setup
// Full pipeline: takes ko messages (from crawl or manual), generates all
// target language translations in parallel using batched provider calls.
export async function POST(_request: NextRequest, context: RouteContext) {
  const { id: siteId } = await context.params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      languages: { where: { active: true }, include: { language: true } },
      messages: true,
    },
  });

  if (!site) {
    return NextResponse.json(
      { error: "사이트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const koMsg = site.messages.find((m) => m.locale === "ko");
  if (!koMsg) {
    return NextResponse.json(
      { error: "한국어 소스 메시지가 없습니다. 먼저 크롤링하세요." },
      { status: 400 },
    );
  }

  let koMessages: MessageObject;
  try {
    koMessages = JSON.parse(koMsg.messages) as MessageObject;
  } catch {
    return NextResponse.json(
      { error: "한국어 메시지 파싱 실패" },
      { status: 500 },
    );
  }

  const targetLocales = site.languages
    .filter((sl) => !sl.language.isSource)
    .map((sl) => sl.language.code);

  if (targetLocales.length === 0) {
    return NextResponse.json({ ok: true, message: "타겟 언어가 없습니다." });
  }

  const flat = flattenMessages(koMessages as MessageValue);
  const sources = flat.map((e) => e.value);

  // Translate every target locale in parallel — each uses batched provider calls.
  const localeOutcomes = await Promise.all(
    targetLocales.map(async (locale): Promise<[string, LocaleResult]> => {
      try {
        const batch = await translateBatch(sources, "ko", locale, { siteId });
        const translatedTree = unflattenMessages(
          koMessages as MessageValue,
          flat,
          batch.translated,
        );
        const messagesJson = JSON.stringify(translatedTree);

        await prisma.siteMessages.upsert({
          where: { siteId_locale: { siteId, locale } },
          update: { messages: messagesJson },
          create: { siteId, locale, messages: messagesJson },
        });

        return [
          locale,
          {
            keys: countStrings(translatedTree),
            cacheHits: batch.cacheHits,
            cacheMisses: batch.cacheMisses,
            durationMs: batch.durationMs,
            provider: batch.provider,
            success: true,
          },
        ];
      } catch (err) {
        return [
          locale,
          {
            keys: 0,
            cacheHits: 0,
            cacheMisses: 0,
            durationMs: 0,
            provider: "error",
            success: false,
            error: String(err).slice(0, 300),
          },
        ];
      }
    }),
  );

  const results: Record<string, LocaleResult> = {};
  for (const [locale, outcome] of localeOutcomes) {
    results[locale] = outcome;
  }

  return NextResponse.json({
    ok: true,
    site: site.name,
    sourceKeys: sources.length,
    targetLanguages: targetLocales,
    results,
  });
}
