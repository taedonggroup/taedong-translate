import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://taedong-translate.vercel.app";
  const snippet = `<script src="${baseUrl}/sdk.js" data-api-key="${site.apiKey}" async></script>`;

  return NextResponse.json({
    snippet,
    siteId: site.id,
    siteName: site.name,
    apiKey: site.apiKey,
  });
}
