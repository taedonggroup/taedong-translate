import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translate } from "@/lib/translate";

export const maxDuration = 60;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/webhook
// Body: {
//   event: "content.updated",
//   changes: { "nav.about": "병원소개 변경됨", "hero.title": "새 타이틀" }
// }
// Auth: Bearer <apiKey>
export async function POST(request: NextRequest) {
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
        },
        messages: true,
      },
    });

    if (!site || !site.active) {
      return NextResponse.json(
        { error: "Invalid site" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const body = await request.json();
    const { event, changes } = body as {
      event: string;
      changes: Record<string, unknown>;
    };

    if (
      !changes ||
      typeof changes !== "object" ||
      Object.keys(changes).length === 0
    ) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Get target languages
    const targetLanguages = site.languages
      .filter((sl) => !sl.language.isSource)
      .map((sl) => sl.language.code);

    if (targetLanguages.length === 0) {
      return NextResponse.json(
        { ok: true, translated: 0, message: "No target languages" },
        { headers: CORS_HEADERS },
      );
    }

    // 1. Update ko source messages with changes
    const koMsg = site.messages.find((m) => m.locale === "ko");
    let koMessages: Record<string, unknown> = {};
    if (koMsg) {
      try {
        koMessages = JSON.parse(koMsg.messages) as Record<string, unknown>;
      } catch {
        // start fresh if parse fails
      }
    }

    // Apply changes to ko messages (changes is flat: "nav.about" → "새 값")
    for (const [path, value] of Object.entries(changes)) {
      setNestedValue(koMessages, path, value as string);
    }

    // Save updated ko messages
    await prisma.siteMessages.upsert({
      where: { siteId_locale: { siteId: site.id, locale: "ko" } },
      update: { messages: JSON.stringify(koMessages) },
      create: {
        siteId: site.id,
        locale: "ko",
        messages: JSON.stringify(koMessages),
      },
    });

    // 2. For each target language, translate only the changed fields
    let translatedCount = 0;

    for (const locale of targetLanguages) {
      const existingMsg = site.messages.find((m) => m.locale === locale);
      let targetMessages: Record<string, unknown> = {};
      if (existingMsg) {
        try {
          targetMessages = JSON.parse(existingMsg.messages) as Record<
            string,
            unknown
          >;
        } catch {
          // start fresh if parse fails
        }
      }

      // Translate each changed field
      for (const [path, value] of Object.entries(changes)) {
        if (typeof value !== "string" || value.trim().length === 0) continue;
        try {
          const result = await translate(value, "ko", locale);
          setNestedValue(targetMessages, path, result.translated);
          translatedCount++;
        } catch (err) {
          console.error(`Webhook translate error [${path} → ${locale}]:`, err);
        }
      }

      // Save updated target messages
      await prisma.siteMessages.upsert({
        where: { siteId_locale: { siteId: site.id, locale } },
        update: { messages: JSON.stringify(targetMessages) },
        create: {
          siteId: site.id,
          locale,
          messages: JSON.stringify(targetMessages),
        },
      });
    }

    // Log the webhook event
    await prisma.translationLog.create({
      data: {
        siteId: site.id,
        fromLang: "ko",
        toLang: targetLanguages.join(","),
        inputChars: Object.values(changes).join("").length,
        outputChars: translatedCount * 20, // approximate
        durationMs: 0,
        cost: 0,
        success: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        event,
        changedFields: Object.keys(changes).length,
        targetLanguages,
        translatedCount,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[POST /api/webhook]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

// Helper: set a nested value by dot-path ("nav.about" → obj.nav.about = value)
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: string,
) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
