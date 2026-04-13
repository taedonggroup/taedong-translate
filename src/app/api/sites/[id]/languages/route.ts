import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/sites/[id]/languages
// Returns all languages with "enabled" flag for this site
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

    const [allLanguages, siteLanguages] = await Promise.all([
      prisma.language.findMany({ orderBy: { order: "asc" } }),
      prisma.siteLanguage.findMany({
        where: { siteId },
        include: { language: true },
      }),
    ]);

    const enabledIds = new Set(siteLanguages.map((sl) => sl.languageId));

    const languages = allLanguages.map((lang) => ({
      id: lang.id,
      code: lang.code,
      name: lang.name,
      isSource: lang.isSource,
      order: lang.order,
      active: lang.active,
      enabled: enabledIds.has(lang.id),
    }));

    return NextResponse.json({ languages });
  } catch (error) {
    console.error("[GET /api/sites/[id]/languages]", error);
    return NextResponse.json(
      { error: "언어 목록을 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

// PUT /api/sites/[id]/languages
// Body: { languageId: string, enabled: boolean }
// Creates or deletes the SiteLanguage record
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id: siteId } = await context.params;
    const body = (await req.json()) as {
      languageId?: unknown;
      enabled?: unknown;
    };

    if (!body.languageId || typeof body.languageId !== "string") {
      return NextResponse.json(
        { error: "languageId가 필요합니다." },
        { status: 400 },
      );
    }
    if (body.enabled === undefined || typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled(boolean)가 필요합니다." },
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

    const language = await prisma.language.findUnique({
      where: { id: body.languageId },
    });
    if (!language) {
      return NextResponse.json(
        { error: "언어를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (language.isSource) {
      return NextResponse.json(
        { error: "소스 언어는 비활성화할 수 없습니다." },
        { status: 400 },
      );
    }

    if (body.enabled) {
      await prisma.siteLanguage.upsert({
        where: {
          siteId_languageId: { siteId, languageId: body.languageId },
        },
        update: { active: true },
        create: { siteId, languageId: body.languageId, active: true },
      });
    } else {
      await prisma.siteLanguage
        .delete({
          where: {
            siteId_languageId: { siteId, languageId: body.languageId },
          },
        })
        .catch(() => {
          // Record may not exist — that's fine
        });
    }

    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (error) {
    console.error("[PUT /api/sites/[id]/languages]", error);
    return NextResponse.json(
      { error: "언어 설정 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
