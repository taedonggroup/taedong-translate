import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translate } from "@/lib/translate";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // API key auth
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  // Validate API key
  let site: { id: string; active: boolean } | null = null;
  try {
    site = await prisma.site.findUnique({ where: { apiKey } });
  } catch {
    // DB not available - deny access
  }

  if (!site) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 403 });
  }

  if (!site.active) {
    return NextResponse.json({ error: "Site is inactive" }, { status: 403 });
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
      { status: 400 },
    );
  }

  // Check if the target language is enabled for this site
  const siteLanguage = await prisma.siteLanguage.findFirst({
    where: {
      siteId: site.id,
      language: { code: to },
      active: true,
    },
    include: { language: true },
  });

  if (!siteLanguage) {
    return NextResponse.json(
      { error: `Language "${to}" is not enabled for this site` },
      { status: 400 },
    );
  }

  // Single text
  if (text) {
    const result = await translate(text, from, to);
    return NextResponse.json(result);
  }

  // Batch
  if (texts && Array.isArray(texts)) {
    const results = await Promise.all(texts.map((t) => translate(t, from, to)));
    return NextResponse.json({ results });
  }

  return NextResponse.json(
    { error: "text or texts required" },
    { status: 400 },
  );
}
