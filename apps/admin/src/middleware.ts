import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "lw_session";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/stories");

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/stories/:path*", "/login"],
};
