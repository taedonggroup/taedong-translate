import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: Trigger bulk DB content translation on the connected site
// Body: { locale?: string } — optional, currently ignored by site (translates all locales)
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id: siteId } = await params;

  const body = (await request.json().catch(() => ({}))) as { locale?: string };

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const siteUrl = `https://${site.domain}/api/translations/bulk-remote`;

  try {
    const res = await fetch(siteUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${site.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locale: body.locale }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Site returned ${res.status}: ${errorText}` },
        { status: 502 },
      );
    }

    const result = (await res.json()) as {
      success: boolean;
      totalTranslations: number;
      models: Record<string, number>;
    };

    return NextResponse.json({
      success: result.success,
      site: site.name,
      totalTranslations: result.totalTranslations,
      models: result.models,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach site: ${String(err)}` },
      { status: 502 },
    );
  }
}
