import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/quota — public read-only summary of provider headroom + cache health.
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: [{ isDefault: "desc" }, { priority: "asc" }],
      select: {
        name: true,
        displayName: true,
        active: true,
        isDefault: true,
        priority: true,
        freeQuotaUsed: true,
        freeQuotaLimit: true,
        quotaResetAt: true,
      },
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [logsTotal, logsCacheHits, cacheCount] = await Promise.all([
      prisma.translationLog.count({
        where: { createdAt: { gte: monthStart }, success: true },
      }),
      prisma.translationLog.count({
        where: {
          createdAt: { gte: monthStart },
          success: true,
          cacheHit: true,
        },
      }),
      prisma.translationCache.count(),
    ]);

    const cacheHitRate =
      logsTotal > 0 ? +(logsCacheHits / logsTotal).toFixed(3) : 0;

    const enriched = providers.map((p) => {
      const remaining =
        p.freeQuotaLimit > 0 ? p.freeQuotaLimit - p.freeQuotaUsed : null;
      const usagePct =
        p.freeQuotaLimit > 0
          ? +((p.freeQuotaUsed / p.freeQuotaLimit) * 100).toFixed(1)
          : null;
      return {
        ...p,
        remaining,
        usagePct,
        warning: usagePct !== null && usagePct >= 80,
      };
    });

    return NextResponse.json({
      providers: enriched,
      cache: {
        entries: cacheCount,
        monthlyHitRate: cacheHitRate,
        monthlyTotal: logsTotal,
        monthlyHits: logsCacheHits,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
