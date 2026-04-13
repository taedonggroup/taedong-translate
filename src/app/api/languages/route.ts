import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ languages });
  } catch (error) {
    console.error("[GET /api/languages]", error);
    return NextResponse.json(
      { error: "언어 목록을 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: unknown;
      name?: unknown;
      isSource?: unknown;
      order?: unknown;
    };

    if (!body.code || typeof body.code !== "string" || !body.code.trim()) {
      return NextResponse.json(
        { error: "언어 코드를 입력하세요." },
        { status: 400 },
      );
    }
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "언어 이름을 입력하세요." },
        { status: 400 },
      );
    }

    const maxOrder = await prisma.language.aggregate({ _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const language = await prisma.language.create({
      data: {
        code: body.code.trim().toLowerCase(),
        name: body.name.trim(),
        isSource:
          body.isSource !== undefined && typeof body.isSource === "boolean"
            ? body.isSource
            : false,
        order:
          body.order !== undefined && typeof body.order === "number"
            ? body.order
            : nextOrder,
      },
    });

    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/languages]", error);
    return NextResponse.json(
      { error: "언어 추가에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: unknown;
      name?: unknown;
      active?: unknown;
      order?: unknown;
      isSource?: unknown;
    };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const updateData: {
      name?: string;
      active?: boolean;
      order?: number;
      isSource?: boolean;
    } = {};

    if (
      body.name !== undefined &&
      typeof body.name === "string" &&
      body.name.trim()
    ) {
      updateData.name = body.name.trim();
    }
    if (body.active !== undefined && typeof body.active === "boolean") {
      updateData.active = body.active;
    }
    if (body.order !== undefined && typeof body.order === "number") {
      updateData.order = body.order;
    }
    if (body.isSource !== undefined && typeof body.isSource === "boolean") {
      updateData.isSource = body.isSource;
    }

    const language = await prisma.language.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({ language });
  } catch (error) {
    console.error("[PUT /api/languages]", error);
    return NextResponse.json(
      { error: "언어 수정에 실패했습니다." },
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

    await prisma.language.delete({ where: { id: body.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/languages]", error);
    return NextResponse.json(
      { error: "언어 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
