import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/sites/[id]/messages
// Returns all stored messages for a site, keyed by locale
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: siteId } = await context.params;

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json(
        { error: "사이트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const siteMessages = await prisma.siteMessages.findMany({
      where: { siteId },
      orderBy: { locale: "asc" },
    });

    const messagesMap: Record<string, unknown> = {};
    for (const sm of siteMessages) {
      try {
        messagesMap[sm.locale] = JSON.parse(sm.messages);
      } catch {
        // Skip malformed JSON
      }
    }

    return NextResponse.json({ messages: messagesMap });
  } catch (error) {
    console.error("[GET /api/sites/[id]/messages]", error);
    return NextResponse.json(
      { error: "메시지를 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

// POST /api/sites/[id]/messages
// Body: { locale: "vi", messages: { nav: { about: "..." } } }
// Upserts the generated messages for a locale
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: siteId } = await context.params;
    const body = (await req.json()) as {
      locale?: unknown;
      messages?: unknown;
    };

    if (!body.locale || typeof body.locale !== "string") {
      return NextResponse.json(
        { error: "locale이 필요합니다." },
        { status: 400 },
      );
    }
    if (!body.messages || typeof body.messages !== "object") {
      return NextResponse.json(
        { error: "messages가 필요합니다." },
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

    const messagesJson = JSON.stringify(body.messages);

    const siteMessages = await prisma.siteMessages.upsert({
      where: { siteId_locale: { siteId, locale: body.locale } },
      update: { messages: messagesJson },
      create: { siteId, locale: body.locale, messages: messagesJson },
    });

    return NextResponse.json({
      ok: true,
      id: siteMessages.id,
      locale: siteMessages.locale,
    });
  } catch (error) {
    console.error("[POST /api/sites/[id]/messages]", error);
    return NextResponse.json(
      { error: "메시지 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
