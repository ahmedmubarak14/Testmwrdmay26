"use server";

import { data } from "@mwrd/shared";
import type { User } from "@mwrd/shared";

import { setSessionCookie } from "../utils/session";
import { getRedirectUrl, type AppRole, type RedirectDecision } from "../utils/role-redirect";

export interface LoginActionResult {
  ok: boolean;
  error?: string;
  user?: User;
  redirect?: RedirectDecision;
}

export async function loginAction(input: {
  email: string;
  password: string;
  currentApp: AppRole;
}): Promise<LoginActionResult> {
  try {
    const result = await data.signIn({ email: input.email, password: input.password });

    if (
      result.user.role !== "client" &&
      result.user.role !== "supplier"
    ) {
      // CLAUDE.md auth split: backoffice user on public auth.
      // Deliberately give NO helpful URL.
      return {
        ok: false,
        error:
          "Backoffice users must sign in at backoffice.mwrd.io. This URL is for clients and suppliers only.",
      };
    }

    if (result.user.activation_status !== "activated") {
      return {
        ok: false,
        error: "Account not activated. Check your email for the activation link.",
      };
    }

    await setSessionCookie(result.session_token);
    const redirect = getRedirectUrl(result.user, input.currentApp);
    return { ok: true, user: result.user, redirect };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Sign-in failed" };
  }
}
