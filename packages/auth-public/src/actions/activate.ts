"use server";

import { data } from "@mwrd/shared";

import { setSessionCookie } from "../utils/session";

export interface VerifyTokenResult {
  ok: boolean;
  error?: string;
  email?: string;
  real_name?: string;
}

export async function verifyActivationTokenAction(token: string): Promise<VerifyTokenResult> {
  const user = await data.getUserByActivationToken(token);
  if (!user) return { ok: false, error: "This activation link is invalid or expired." };
  return { ok: true, email: user.email, real_name: user.real_name };
}

export interface ActivateActionResult {
  ok: boolean;
  error?: string;
  redirect_to?: string;
}

export async function activateAction(input: {
  token: string;
  password: string;
}): Promise<ActivateActionResult> {
  try {
    const user = await data.activateAccount({
      activation_token: input.token,
      password: input.password,
    });
    // Auto-sign-in after activation so the user lands on /onboarding.
    const session = await data.signIn({ email: user.email, password: input.password });
    await setSessionCookie(session.session_token);
    return { ok: true, redirect_to: "/onboarding" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Activation failed" };
  }
}
