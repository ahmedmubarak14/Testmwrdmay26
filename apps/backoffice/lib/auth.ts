// Backoffice auth — SEPARATE from public auth by design.
//
// CLAUDE.md auth split rule (NEVER violate):
//   - apps/backoffice has its OWN auth code.
//   - NEVER imports @mwrd/auth-public.
//   - Backoffice idle session timeout: 15 min (vs 24h for public).
//   - Cookie name 'mwrd_session_backoffice' is intentionally distinct from
//     the public 'mwrd_session_public' so middleware can tell them apart.
//
// Phase 2 will swap signIn/getCurrentUser for Supabase Auth with separate
// `aud` claims for public vs backoffice; the wire format here is the same
// API surface the swap will keep.

import { data } from "@mwrd/shared";
import type { User, UserRole } from "@mwrd/shared";

export const BACKOFFICE_COOKIE_NAME = "mwrd_session_backoffice";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // hard cap; idle timeout enforced separately
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const BACKOFFICE_ROLES: ReadonlySet<UserRole> = new Set([
  "admin",
  "ops",
  "finance",
  "cs",
]);

export function isBackofficeRole(role: UserRole): boolean {
  return BACKOFFICE_ROLES.has(role);
}

export interface BackofficeSignInResult {
  user: User;
  session_token: string;
}

export async function signInBackoffice(input: {
  email: string;
  password: string;
}): Promise<BackofficeSignInResult> {
  const result = await data.signIn(input);
  if (!isBackofficeRole(result.user.role)) {
    // Don't leak useful info — same generic error a non-backoffice user gets.
    await data.signOut(result.session_token);
    throw new Error("This portal is for internal users only.");
  }
  return result;
}

export async function getBackofficeSession(token: string | null): Promise<User | null> {
  if (!token) return null;
  const sess = await data.getSessionRecord(token);
  if (!sess) return null;

  // Idle timeout — 15 minutes since last_seen.
  const ageMs = Date.now() - new Date(sess.last_seen_at).getTime();
  if (ageMs > IDLE_TIMEOUT_MS) {
    await data.signOut(token);
    return null;
  }

  const user = await data.getCurrentUser(token);
  if (!user) return null;
  if (!isBackofficeRole(user.role)) {
    await data.signOut(token);
    return null;
  }

  // Touch — extends the idle window.
  await data.touchSession(token);
  return user;
}

export async function setBackofficeCookie(token: string): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(BACKOFFICE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearBackofficeCookie(): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.delete(BACKOFFICE_COOKIE_NAME);
  // Also clear the public cookie if it leaked into this domain — defense
  // in depth for the local dev case where both domains are localhost.
  jar.delete("mwrd_session_public");
}

export async function getBackofficeCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return jar.get(BACKOFFICE_COOKIE_NAME)?.value ?? null;
}

export async function inviteInternalUser(input: {
  email: string;
  real_name: string;
  phone: string;
  role: "admin" | "ops" | "finance" | "cs";
  actor_user_id: string;
}): Promise<User> {
  return data.inviteInternalUser(input);
}

export async function activateInternalUser(input: {
  activation_token: string;
  password: string;
}): Promise<User> {
  return data.activateInternalUser(input);
}
