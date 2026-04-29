import { NextRequest, NextResponse } from "next/server";
import { translateBatch } from "@/lib/translate";

export const maxDuration = 60;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function POST(request: NextRequest) {
  // If ADMIN_TOKEN is configured, require it. Otherwise (dev) allow.
  if (ADMIN_TOKEN) {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (auth !== ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = (await request.json()) as {
      text?: string;
      targets?: string[];
      from?: string;
    };
    const { text, targets, from = "ko" } = body;

    if (!text || !targets || !Array.isArray(targets)) {
      return NextResponse.json(
        { error: "text and targets required" },
        { status: 400 },
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "텍스트는 5000자 이하여야 합니다" },
        { status: 400 },
      );
    }

    // Translate all target languages in parallel (independent quota draws).
    const results = await Promise.all(
      targets.map(async (to) => {
        try {
          const r = await translateBatch([text], from, to);
          return {
            translated: r.translated[0] ?? "",
            provider: r.provider,
            durationMs: r.durationMs,
            inputChars: r.inputChars,
            outputChars: r.outputChars,
            cost: r.cost,
            cacheHit: r.cacheHits > 0,
            toLang: to,
            success: true,
          };
        } catch (error) {
          return {
            translated: "",
            provider: "error",
            durationMs: 0,
            inputChars: text.length,
            outputChars: 0,
            cost: 0,
            cacheHit: false,
            toLang: to,
            success: false,
            error: String(error),
          };
        }
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[/api/playground]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
