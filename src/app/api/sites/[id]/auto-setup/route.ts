import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translate } from "@/lib/translate";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

type MessageValue = string | MessageObject | MessageValue[];
interface MessageObject {
  [key: string]: MessageValue;
}

async function translateObject(
  obj: MessageValue,
  from: string,
  to: string,
): Promise<MessageValue> {
  if (typeof obj === "string") {
    if (obj.length === 0) return obj;
    try {
      const result = await translate(obj, from, to);
      return result.translated;
    } catch {
      return obj;
    }
  }
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => translateObject(item, from, to)));
  }
  if (obj && typeof obj === "object") {
    const result: MessageObject = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await translateObject(value, from, to);
      if (typeof value === "string" && value.length > 0) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    return result;
  }
  return obj;
}

function countKeys(obj: unknown): number {
  if (typeof obj === "string") return 1;
  if (Array.isArray(obj)) return obj.reduce((s, i) => s + countKeys(i), 0);
  if (obj && typeof obj === "object") {
    return Object.values(obj).reduce((s: number, v) => s + countKeys(v), 0);
  }
  return 0;
}

// POST /api/sites/[id]/auto-setup
// Full pipeline: takes ko messages (from crawl or manual), generates all target language translations
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: siteId } = await context.params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      languages: {
        where: { active: true },
        include: { language: true },
      },
      messages: true,
    },
  });

  if (!site) {
    return NextResponse.json(
      { error: "사이트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  // Get ko source messages
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

  const targetLanguages = site.languages
    .filter((sl) => !sl.language.isSource)
    .map((sl) => sl.language.code);

  if (targetLanguages.length === 0) {
    return NextResponse.json({ ok: true, message: "타겟 언어가 없습니다." });
  }

  const results: Record<string, { keys: number; success: boolean }> = {};

  for (const locale of targetLanguages) {
    try {
      const startTime = Date.now();
      const translated = await translateObject(koMessages, "ko", locale);
      const durationMs = Date.now() - startTime;

      // Save
      const messagesJson = JSON.stringify(translated);
      await prisma.siteMessages.upsert({
        where: { siteId_locale: { siteId, locale } },
        update: { messages: messagesJson },
        create: { siteId, locale, messages: messagesJson },
      });

      const keyCount = countKeys(translated);
      results[locale] = { keys: keyCount, success: true };

      // Log
      await prisma.translationLog.create({
        data: {
          siteId,
          fromLang: "ko",
          toLang: locale,
          inputChars: koMsg.messages.length,
          outputChars: messagesJson.length,
          durationMs,
          cost: 0,
          success: true,
        },
      });

      console.log(
        `[auto-setup] ${site.name}: ${locale} done (${keyCount} keys, ${durationMs}ms)`,
      );
    } catch (error) {
      console.error(`[auto-setup] ${locale} failed:`, error);
      results[locale] = { keys: 0, success: false };
    }
  }

  return NextResponse.json({
    ok: true,
    site: site.name,
    targetLanguages,
    results,
  });
}
