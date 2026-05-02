import { redirect } from "next/navigation";
import type { User } from "@mwrd/shared";

import { getBackofficeCookie, getBackofficeSession } from "./auth";

export async function getViewer(): Promise<User> {
  const token = await getBackofficeCookie();
  const user = await getBackofficeSession(token);
  if (!user) redirect("/login?reason=expired");
  return user;
}

export function isSuperadmin(user: User): boolean {
  // Phase 1: treat the seeded admin@mwrd.com as superadmin. Phase 2 will
  // gate this on a permissions table.
  return user.email === "admin@mwrd.com";
}
