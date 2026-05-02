// Session cookie helpers for the WEB.
// Uses Next.js's async cookies() API (Next 15+).
// Mobile uses expo-secure-store — exported separately in Prompt 7.
//
// Middleware reads the cookie directly via `request.cookies.get(SESSION_COOKIE_NAME)`,
// because the cookies() helper from next/headers is not callable inside middleware.

export const SESSION_COOKIE_NAME = "mwrd_session_public";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours per CLAUDE.md public-session policy.

/**
 * Server-only. Sets the session cookie. Must be called from a server action
 * or route handler — Next.js disallows cookie writes elsewhere.
 */
export async function setSessionCookie(token: string): Promise<void> {
  // Lazy-import so the package doesn't depend on next/headers at type level
  // for callers that only need SESSION_COOKIE_NAME (e.g. middleware).
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return jar.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
