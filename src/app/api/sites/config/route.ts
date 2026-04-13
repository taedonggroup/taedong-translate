import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "public, max-age=300",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const site = await prisma.site.findUnique({
      where: { apiKey },
      include: {
        languages: {
          where: { active: true },
          include: { language: true },
          orderBy: { language: { order: "asc" } },
        },
        messages: true,
      },
    });

    if (!site || !site.active) {
      return NextResponse.json(
        { error: "Invalid or inactive site" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const languages = site.languages.map((sl) => ({
      code: sl.language.code,
      name: sl.language.name,
      isSource: sl.language.isSource,
    }));

    const sourceLanguage = languages.find((l) => l.isSource)?.code ?? "ko";
    const targetLanguages = languages
      .filter((l) => !l.isSource)
      .map((l) => l.code);

    const messagesMap: Record<string, unknown> = {};
    for (const sm of site.messages) {
      try {
        messagesMap[sm.locale] = JSON.parse(sm.messages);
      } catch {
        // Skip malformed JSON
      }
    }

    const responseBody = {
      site: {
        id: site.id,
        name: site.name,
        domain: site.domain,
      },
      languages,
      sourceLanguage,
      targetLanguages,
      defaultLocale: sourceLanguage,
      locales: languages.map((l) => l.code),
      messages: messagesMap,
      sdk: {
        widgetPosition: "bottom-right",
        widgetEnabled: true,
        primaryColor: "#f97316",
      },
    };

    return NextResponse.json(responseBody, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("[GET /api/sites/config]", error);
    return NextResponse.json(
      { error: "설정을 불러오는데 실패했습니다." },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
