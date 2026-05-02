// Backoffice proxy. Reads the BACKOFFICE-specific cookie name —
// public 'mwrd_session_public' is intentionally rejected here.

import { NextResponse, type NextRequest } from "next/server";

const BACKOFFICE_COOKIE_NAME = "mwrd_session_backoffice";

const PUBLIC_PATHS = ["/login", "/internal/activate", "/error"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();
  // Root → /login (decided in app/page.tsx redirect, but proxy is faster).
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const hasSession = Boolean(request.cookies.get(BACKOFFICE_COOKIE_NAME)?.value);
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
