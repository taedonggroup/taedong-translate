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

    const todayCount = await prisma.translationLog.count({
      where: { createdAt: { gte: todayStart }, success: true },
    });

    const monthCount = await prisma.translationLog.count({
      where: { createdAt: { gte: monthStart }, success: true },
    });

    const monthCostData = await prisma.translationLog.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { cost: true },
    });

    const sites = await prisma.site.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, domain: true, active: true },
    });

    const providers = await prisma.provider.findMany({
      orderBy: { isDefault: "desc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        active: true,
        isDefault: true,
      },
    });

    const recentLogs = await prisma.translationLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        site: { select: { name: true } },
        provider: { select: { displayName: true } },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedLogs = recentLogs.map((log: any) => ({
      provider: log.provider?.displayName ?? "unknown",
      durationMs: log.durationMs,
      inputChars: log.inputChars,
      success: log.success,
      createdAt: log.createdAt.toISOString(),
      siteName: log.site?.name ?? "-",
      toLang: log.toLang,
    }));

    return NextResponse.json({
      today: todayCount,
      month: monthCount,
      cost: monthCostData._sum.cost ?? 0,
      sites,
      providers,
      recentLogs: formattedLogs,
    });
  } catch (error) {
    console.error("[/api/stats]", error);
    return NextResponse.json(
      {
        today: 0,
        month: 0,
        cost: 0,
        sites: [],
        providers: [],
        recentLogs: [],
        error: String(error),
      },
      { status: 200 },
    );
  }
}
