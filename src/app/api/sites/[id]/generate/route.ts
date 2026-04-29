import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translateBatch } from "@/lib/translate";
import {
  flattenMessages,
  unflattenMessages,
  MessageObject,
  MessageValue,
} from "@/lib/messages";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
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

    const sourceMessages = body.sourceMessages as MessageObject;
    const flat = flattenMessages(sourceMessages as MessageValue);
    const sources = flat.map((e) => e.value);

    const batch = await translateBatch(sources, "ko", body.locale, {
      siteId,
    });

    const translated = unflattenMessages(
      sourceMessages as MessageValue,
      flat,
      batch.translated,
    );

    return NextResponse.json({
      locale: body.locale,
      messages: translated,
      stats: {
        keys: sources.length,
        cacheHits: batch.cacheHits,
        cacheMisses: batch.cacheMisses,
        durationMs: batch.durationMs,
        provider: batch.provider,
        cost: batch.cost,
      },
    });
  } catch (error) {
    console.error("[POST /api/sites/[id]/generate]", error);
    return NextResponse.json(
      { error: "번역 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
