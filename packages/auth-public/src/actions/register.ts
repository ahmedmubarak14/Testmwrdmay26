"use server";

import { data } from "@mwrd/shared";
import type { User } from "@mwrd/shared";

export interface RegisterActionInput {
  email: string;
  real_name: string;
  phone: string;
  role: "client" | "supplier";
  company_real_name: string;
  signup_intent?: string | null;
  expected_monthly_volume_sar?: number | null;
  language?: "en" | "ar";
}

export interface RegisterActionResult {
  ok: boolean;
  error?: string;
  user?: User;
}

export async function registerAction(input: RegisterActionInput): Promise<RegisterActionResult> {
  try {
    const user = await data.registerPublic(input);
    return { ok: true, user };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Registration failed" };
  }
}
