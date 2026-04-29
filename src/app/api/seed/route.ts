import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const defaultLanguages = [
      { code: "ko", name: "한국어", isSource: true, order: 0 },
      { code: "en", name: "English", isSource: false, order: 1 },
      { code: "ja", name: "日本語", isSource: false, order: 2 },
      { code: "zh", name: "中文", isSource: false, order: 3 },
      { code: "vi", name: "Tiếng Việt", isSource: false, order: 4 },
      { code: "th", name: "ไทย", isSource: false, order: 5 },
      { code: "id", name: "Bahasa Indonesia", isSource: false, order: 6 },
    ];

    for (const lang of defaultLanguages) {
      await prisma.language.upsert({
        where: { code: lang.code },
        update: {},
        create: lang,
      });
    }

    // Providers — DeepL Free is the recommended default. Claude Haiku is
    // available as a higher-quality fallback. MyMemory is implicit.
    const deepl = await prisma.provider.upsert({
      where: { name: "deepl" },
      update: {
        supportsBatch: true,
        priority: 10,
        freeQuotaLimit: 500_000,
        maxCharsPerCall: 30000,
      },
      create: {
        name: "deepl",
        displayName: "DeepL Free",
        apiKey: "",
        model: null,
        costPerChar: 0,
        active: true,
        isDefault: true,
        supportsBatch: true,
        priority: 10,
        freeQuotaLimit: 500_000,
        maxCharsPerCall: 30000,
      },
    });

    await prisma.provider.upsert({
      where: { name: "claude" },
      update: {
        supportsBatch: true,
        priority: 50,
      },
      create: {
        name: "claude",
        displayName: "Claude Haiku 4.5",
        apiKey: "",
        model: "claude-haiku-4-5",
        costPerChar: 0.000001,
        active: false,
        isDefault: false,
        supportsBatch: true,
        priority: 50,
        freeQuotaLimit: 0,
        maxCharsPerCall: 100000,
      },
    });

    // Sample sites — only created if they don't already exist.
    const vitamin = await prisma.site.upsert({
      where: { apiKey: "td_tr_vitamin_demo" },
      update: {},
      create: {
        name: "비타민의원",
        domain: "vitamin-clinic-taedong.vercel.app",
        apiKey: "td_tr_vitamin_demo",
        active: true,
      },
    });

    const seolin = await prisma.site.upsert({
      where: { apiKey: "td_tr_seolin_demo" },
      update: {},
      create: {
        name: "서린실업",
        domain: "seolin-website.vercel.app",
        apiKey: "td_tr_seolin_demo",
        active: true,
      },
    });

    const allLangs = await prisma.language.findMany();
    for (const site of [vitamin, seolin]) {
      for (const lang of allLangs) {
        await prisma.siteLanguage.upsert({
          where: {
            siteId_languageId: { siteId: site.id, languageId: lang.id },
          },
          update: {},
          create: { siteId: site.id, languageId: lang.id },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "시드 데이터가 생성되었습니다.",
      providerDefault: deepl.name,
      languages: allLangs.length,
    });
  } catch (error) {
    console.error("[/api/seed]", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
