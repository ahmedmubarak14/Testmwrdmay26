"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { data } from "@mwrd/shared";

import {
  activateInternalUser,
  clearBackofficeCookie,
  getBackofficeCookie,
  inviteInternalUser,
  setBackofficeCookie,
  signInBackoffice,
} from "@/lib/auth";
import { getViewer, isSuperadmin } from "@/lib/viewer";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  try {
    const result = await signInBackoffice(input);
    await setBackofficeCookie(result.session_token);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sign-in failed",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const token = await getBackofficeCookie();
  if (token) await data.signOut(token);
  await clearBackofficeCookie();
  redirect("/login");
}

export async function activateInternalAction(input: {
  activation_token: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; redirect_to?: string }> {
  try {
    const user = await activateInternalUser(input);
    const session = await data.signIn({ email: user.email, password: input.password });
    await setBackofficeCookie(session.session_token);
    return { ok: true, redirect_to: "/dashboard" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Activation failed",
    };
  }
}

export async function inviteInternalAction(input: {
  email: string;
  real_name: string;
  phone: string;
  role: "admin" | "ops" | "finance" | "cs";
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await getViewer();
    if (!isSuperadmin(actor)) {
      return { ok: false, error: "Only superadmin can invite internal users." };
    }
    const invitee = await inviteInternalUser({ ...input, actor_user_id: actor.id });
    await data.appendAuditLog({
      actor_user_id: actor.id,
      action: "invite_internal_user",
      entity_type: "user",
      entity_id: invitee.id,
      after: { email: invitee.email, role: invitee.role },
    });
    revalidatePath("/users/internal");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invite failed" };
  }
}
