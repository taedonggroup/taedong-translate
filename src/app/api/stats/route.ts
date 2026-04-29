import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayCount,
      monthCount,
      monthCacheHits,
      monthCostData,
      sites,
      providers,
      recentLogs,
      cacheCount,
    ] = await Promise.all([
      prisma.translationLog.count({
        where: { createdAt: { gte: todayStart }, success: true },
      }),
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
      prisma.translationLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { cost: true },
      }),
      prisma.site.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, domain: true, active: true },
      }),
      prisma.provider.findMany({
        orderBy: [{ isDefault: "desc" }, { priority: "asc" }],
        select: {
          id: true,
          name: true,
          displayName: true,
          active: true,
          isDefault: true,
          freeQuotaUsed: true,
          freeQuotaLimit: true,
        },
      }),
      prisma.translationLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          site: { select: { name: true } },
          provider: { select: { displayName: true } },
        },
      }),
      prisma.translationCache.count(),
    ]);

    const formattedLogs = recentLogs.map((log) => ({
      provider: log.provider?.displayName ?? "cache/unknown",
      durationMs: log.durationMs,
      inputChars: log.inputChars,
      cacheHit: log.cacheHit,
      success: log.success,
      createdAt: log.createdAt.toISOString(),
      siteName: log.site?.name ?? "-",
      toLang: log.toLang,
    }));

    return NextResponse.json({
      today: todayCount,
      month: monthCount,
      cost: monthCostData._sum.cost ?? 0,
      cacheHitRate:
        monthCount > 0 ? +(monthCacheHits / monthCount).toFixed(3) : 0,
      cacheEntries: cacheCount,
      sites,
      providers: providers.map((p) => ({
        ...p,
        usagePct:
          p.freeQuotaLimit > 0
            ? +((p.freeQuotaUsed / p.freeQuotaLimit) * 100).toFixed(1)
            : null,
      })),
      recentLogs: formattedLogs,
    });
  } catch (error) {
    console.error("[/api/stats]", error);
    return NextResponse.json(
      {
        today: 0,
        month: 0,
        cost: 0,
        cacheHitRate: 0,
        cacheEntries: 0,
        sites: [],
        providers: [],
        recentLogs: [],
        error: String(error),
      },
      { status: 200 },
    );
  }
}
