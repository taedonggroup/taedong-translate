import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translate, translateBatch } from "@/lib/translate";

export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) {
    return NextResponse.json(
      { error: "API key required" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  let site: { id: string; active: boolean } | null = null;
  try {
    site = await prisma.site.findUnique({
      where: { apiKey: auth },
      select: { id: true, active: true },
    });
  } catch {
    // DB down — deny.
  }

  if (!site) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 403, headers: CORS_HEADERS },
    );
  }
  if (!site.active) {
    return NextResponse.json(
      { error: "Site is inactive" },
      { status: 403, headers: CORS_HEADERS },
    );
  }

  const body = (await request.json()) as {
    text?: string;
    texts?: string[];
    from?: string;
    to?: string;
  };
  const { text, texts, from = "ko", to } = body;

  if (!to) {
    return NextResponse.json(
      { error: "Target language (to) required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Verify target language is enabled for this site.
  const enabled = await prisma.siteLanguage.findFirst({
    where: { siteId: site.id, active: true, language: { code: to } },
    select: { id: true },
  });
  if (!enabled) {
    return NextResponse.json(
      { error: `Language "${to}" is not enabled for this site` },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (texts && Array.isArray(texts)) {
    const result = await translateBatch(texts, from, to, { siteId: site.id });
    return NextResponse.json(result, { headers: CORS_HEADERS });
  }

  if (typeof text === "string") {
    const result = await translate(text, from, to, { siteId: site.id });
    return NextResponse.json(result, { headers: CORS_HEADERS });
  }

  return NextResponse.json(
    { error: "text or texts required" },
    { status: 400, headers: CORS_HEADERS },
  );
}
