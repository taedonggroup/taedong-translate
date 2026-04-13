import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translate } from "@/lib/translate";

export const maxDuration = 300; // 5 minutes for large translation jobs

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
      return obj; // fallback to original on error
    }
  }
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => translateObject(item, from, to)));
  }
  if (obj && typeof obj === "object") {
    const result: MessageObject = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await translateObject(value, from, to);
      // Small rate-limit delay between string translations
      if (typeof value === "string" && value.length > 0) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    return result;
  }
  return obj;
}

function countChars(obj: MessageValue): number {
  if (typeof obj === "string") return obj.length;
  if (Array.isArray(obj))
    return obj.reduce((sum, item) => sum + countChars(item), 0);
  if (obj && typeof obj === "object") {
    return Object.values(obj).reduce(
      (sum: number, val) => sum + countChars(val as MessageValue),
      0,
    );
  }
  return 0;
}

// POST /api/sites/[id]/generate
// Body: { locale: "vi", sourceMessages: { nav: { about: "병원소개" } } }
// Returns: { locale: "vi", messages: { nav: { about: "Giới thiệu bệnh viện" } } }
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: siteId } = await context.params;
    const body = (await request.json()) as {
      locale?: unknown;
      sourceMessages?: unknown;
    };

    if (!body.locale || typeof body.locale !== "string") {
      return NextResponse.json(
        { error: "locale이 필요합니다." },
        { status: 400 },
      );
    }
    if (!body.sourceMessages || typeof body.sourceMessages !== "object") {
      return NextResponse.json(
        { error: "sourceMessages가 필요합니다." },
        { status: 400 },
      );
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json(
        { error: "사이트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const startTime = Date.now();
    const sourceMessages = body.sourceMessages as MessageObject;
    const translated = await translateObject(sourceMessages, "ko", body.locale);
    const durationMs = Date.now() - startTime;

    const inputChars = countChars(sourceMessages);
    const outputChars = countChars(translated as MessageValue);

    await prisma.translationLog.create({
      data: {
        siteId,
        fromLang: "ko",
        toLang: body.locale,
        inputChars,
        outputChars,
        durationMs,
        cost: 0,
        success: true,
      },
    });

    return NextResponse.json({ locale: body.locale, messages: translated });
  } catch (error) {
    console.error("[POST /api/sites/[id]/generate]", error);
    return NextResponse.json(
      { error: "번역 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
