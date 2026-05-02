// Next.js 16 proxy (formerly middleware). Cookie presence check only —
// per Next 16 guidance, the proxy must not rely on shared modules / globals.
// Deeper checks (role, onboarding) live in server-component layouts.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@mwrd/auth-public";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/register/thank-you",
  "/activate",
  "/error",
  "/",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
