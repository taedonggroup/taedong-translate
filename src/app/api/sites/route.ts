import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { logs: true } },
      },
    });

    return NextResponse.json({ sites });
  } catch (error) {
    console.error("[GET /api/sites]", error);
    return NextResponse.json(
      { error: "사이트 목록을 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: unknown; domain?: unknown };

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "사이트 이름을 입력하세요." },
        { status: 400 },
      );
    }
    if (
      !body.domain ||
      typeof body.domain !== "string" ||
      !body.domain.trim()
    ) {
      return NextResponse.json(
        { error: "도메인을 입력하세요." },
        { status: 400 },
      );
    }

    const apiKey = `td_tr_${crypto.randomUUID()}`;

    const site = await prisma.site.create({
      data: {
        name: body.name.trim(),
        domain: body.domain.trim(),
        apiKey,
      },
      include: { _count: { select: { logs: true } } },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/sites]", error);
    return NextResponse.json(
      { error: "사이트 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: unknown;
      name?: unknown;
      domain?: unknown;
      active?: unknown;
    };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updateData: { name?: string; domain?: string; active?: boolean } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "유효한 이름을 입력하세요." },
          { status: 400 },
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.domain !== undefined) {
      if (typeof body.domain !== "string" || !body.domain.trim()) {
        return NextResponse.json(
          { error: "유효한 도메인을 입력하세요." },
          { status: 400 },
        );
      }
      updateData.domain = body.domain.trim();
    }

    if (body.active !== undefined) {
      if (typeof body.active !== "boolean") {
        return NextResponse.json(
          { error: "active는 boolean이어야 합니다." },
          { status: 400 },
        );
      }
      updateData.active = body.active;
    }

    const site = await prisma.site.update({
      where: { id: body.id },
      data: updateData,
      include: { _count: { select: { logs: true } } },
    });

    return NextResponse.json({ site });
  } catch (error) {
    console.error("[PUT /api/sites]", error);
    return NextResponse.json(
      { error: "사이트 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: unknown };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const site = await prisma.site.update({
      where: { id: body.id },
      data: { active: false },
    });

    return NextResponse.json({ site });
  } catch (error) {
    console.error("[DELETE /api/sites]", error);
    return NextResponse.json(
      { error: "사이트 비활성화에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: unknown };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const newApiKey = `td_tr_${crypto.randomUUID()}`;

    const site = await prisma.site.update({
      where: { id: body.id },
      data: { apiKey: newApiKey },
      include: { _count: { select: { logs: true } } },
    });

    return NextResponse.json({ site });
  } catch (error) {
    console.error("[PATCH /api/sites]", error);
    return NextResponse.json(
      { error: "API 키 재생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
