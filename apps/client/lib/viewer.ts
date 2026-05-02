// Helper for nested pages that already trust the (app) layout's auth guard.
// Returns the current user without redirecting (the layout already redirected
// if anything was wrong).

import { data } from "@mwrd/shared";
import type { User } from "@mwrd/shared";
import { redirect } from "next/navigation";

import { getSessionCookie } from "@mwrd/auth-public";

export async function getViewer(): Promise<User> {
  const token = await getSessionCookie();
  if (!token) redirect("/login");
  const user = await data.getCurrentUser(token);
  if (!user) redirect("/login");
  return user;
}
