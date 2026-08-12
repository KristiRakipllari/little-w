import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// BFF proxy: forwards /api/proxy/<path> → <API_URL>/api/<path>, attaching the
// JWT from the httpOnly session cookie. Keeps the token server-side so the
// browser never handles it, while every admin page calls same-origin.
async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const target = `${API_URL}/api/${path.join("/")}${search}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: BodyInit | undefined;

  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      body = await req.formData();
    } else {
      const text = await req.text();
      if (text) {
        headers["Content-Type"] = "application/json";
        body = text;
      }
    }
  }

  const upstream = await fetch(target, { method: req.method, headers, body });
  const payload = await upstream.text();
  return new NextResponse(payload, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};
