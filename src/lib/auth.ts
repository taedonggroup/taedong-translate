import { NextRequest, NextResponse } from "next/server";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Returns null when authorized, a 401 NextResponse otherwise.
// If ADMIN_TOKEN is not configured (dev), allows the request.
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (!ADMIN_TOKEN) return null;
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function isAdmin(request: NextRequest): boolean {
  if (!ADMIN_TOKEN) return true;
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  return auth === ADMIN_TOKEN;
}
