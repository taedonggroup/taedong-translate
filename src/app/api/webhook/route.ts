import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { translateBatch } from "@/lib/translate";
import { setNestedDotPath, MessageObject } from "@/lib/messages";

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
// Auth: Bearer <site.apiKey>
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const site = await prisma.site.findUnique({
      where: { apiKey: auth },
      include: {
        languages: { where: { active: true }, include: { language: true } },
        messages: true,
      },
    });

    if (!site || !site.active) {
      return NextResponse.json(
        { error: "Invalid site" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const body = (await request.json()) as {
      event?: string;
      changes?: Record<string, unknown>;
    };
    const changes = body.changes;

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

    const targetLocales = site.languages
      .filter((sl) => !sl.language.isSource)
      .map((sl) => sl.language.code);

    if (targetLocales.length === 0) {
      return NextResponse.json(
        { ok: true, translated: 0, message: "No target languages" },
        { headers: CORS_HEADERS },
      );
    }

    // Update ko source first.
    const koMsg = site.messages.find((m) => m.locale === "ko");
    let koMessages: MessageObject = {};
    if (koMsg) {
      try {
        koMessages = JSON.parse(koMsg.messages) as MessageObject;
      } catch {
        // start fresh
      }
    }

    const stringChanges: { path: string; value: string }[] = [];
    for (const [path, raw] of Object.entries(changes)) {
      if (typeof raw !== "string" || raw.trim().length === 0) continue;
      stringChanges.push({ path, value: raw });
      setNestedDotPath(koMessages, path, raw);
    }

    await prisma.siteMessages.upsert({
      where: { siteId_locale: { siteId: site.id, locale: "ko" } },
      update: { messages: JSON.stringify(koMessages) },
      create: {
        siteId: site.id,
        locale: "ko",
        messages: JSON.stringify(koMessages),
      },
    });

    if (stringChanges.length === 0) {
      return NextResponse.json(
        { ok: true, translatedCount: 0, message: "No translatable changes" },
        { headers: CORS_HEADERS },
      );
    }

    const sources = stringChanges.map((c) => c.value);
    let translatedCount = 0;

    // Translate every target locale in parallel.
    await Promise.all(
      targetLocales.map(async (locale) => {
        const existing = site.messages.find((m) => m.locale === locale);
        let target: MessageObject = {};
        if (existing) {
          try {
            target = JSON.parse(existing.messages) as MessageObject;
          } catch {
            // start fresh
          }
        }

        const batch = await translateBatch(sources, "ko", locale, {
          siteId: site.id,
        });

        for (let i = 0; i < stringChanges.length; i++) {
          setNestedDotPath(
            target,
            stringChanges[i].path,
            batch.translated[i] ?? stringChanges[i].value,
          );
          translatedCount++;
        }

        await prisma.siteMessages.upsert({
          where: { siteId_locale: { siteId: site.id, locale } },
          update: { messages: JSON.stringify(target) },
          create: {
            siteId: site.id,
            locale,
            messages: JSON.stringify(target),
          },
        });
      }),
    );

    return NextResponse.json(
      {
        ok: true,
        event: body.event ?? "content.updated",
        changedFields: stringChanges.length,
        targetLanguages: targetLocales,
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
