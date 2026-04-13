import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("[GET /api/providers]", error);
    return NextResponse.json(
      { error: "프로바이더 목록을 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: unknown;
      displayName?: unknown;
    };

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "이름을 입력하세요." },
        { status: 400 },
      );
    }
    if (
      !body.displayName ||
      typeof body.displayName !== "string" ||
      !body.displayName.trim()
    ) {
      return NextResponse.json(
        { error: "표시명을 입력하세요." },
        { status: 400 },
      );
    }

    const provider = await prisma.provider.create({
      data: {
        name: body.name.trim(),
        displayName: body.displayName.trim(),
      },
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/providers]", error);
    return NextResponse.json(
      { error: "프로바이더 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: unknown;
      active?: unknown;
      isDefault?: unknown;
    };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updateData: { active?: boolean; isDefault?: boolean } = {};

    if (body.active !== undefined) {
      if (typeof body.active !== "boolean") {
        return NextResponse.json(
          { error: "active는 boolean이어야 합니다." },
          { status: 400 },
        );
      }
      updateData.active = body.active;
    }

    if (body.isDefault !== undefined) {
      if (typeof body.isDefault !== "boolean") {
        return NextResponse.json(
          { error: "isDefault는 boolean이어야 합니다." },
          { status: 400 },
        );
      }
      updateData.isDefault = body.isDefault;
    }

    // When setting as default, clear all others first
    if (updateData.isDefault === true) {
      await prisma.provider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const provider = await prisma.provider.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("[PUT /api/providers]", error);
    return NextResponse.json(
      { error: "프로바이더 수정에 실패했습니다." },
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

    await prisma.provider.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/providers]", error);
    return NextResponse.json(
      { error: "프로바이더 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
