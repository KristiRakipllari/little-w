import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import type { ApiResponse, AuthTokens } from "@calm-stories/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

// POST /api/session — proxy login to the API and store the JWT in an httpOnly
// cookie. Staff only: parent accounts can authenticate but can't manage content
// (the API's requireStaff/requireAdmin guards reject them on every write).
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const data = (await upstream.json()) as ApiResponse<AuthTokens>;

  if (!upstream.ok || !data.success || !data.data) {
    return NextResponse.json(
      { success: false, error: data.error || "Invalid email or password" },
      { status: upstream.status || 401 }
    );
  }

  const { access_token, user } = data.data;
  if (user.role !== "admin" && user.role !== "editor") {
    return NextResponse.json(
      { success: false, error: "This account doesn't have content access." },
      { status: 403 }
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS,
  });

  return NextResponse.json({ success: true, data: { user } });
}

// DELETE /api/session — logout.
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
