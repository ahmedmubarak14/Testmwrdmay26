"use server";

import { data } from "@mwrd/shared";
import type { User } from "@mwrd/shared";

import { getSessionCookie, clearSessionCookie } from "../utils/session";

async function requireUser(): Promise<User> {
  const token = await getSessionCookie();
  if (!token) throw new Error("Not signed in");
  const user = await data.getCurrentUser(token);
  if (!user) throw new Error("Session expired");
  return user;
}

export interface OnboardingStepResult {
  ok: boolean;
  error?: string;
}

export async function saveCompanyDetailsAction(input: {
  cr_number: string;
  vat_number: string;
  full_address: string;
}): Promise<OnboardingStepResult> {
  try {
    const user = await requireUser();
    await data.updateCompanyOnboarding({
      user_id: user.id,
      cr_number: input.cr_number,
      vat_number: input.vat_number,
      full_address: input.full_address,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function saveSupplierCategoriesAction(input: {
  category_ids: string[];
}): Promise<OnboardingStepResult> {
  try {
    const user = await requireUser();
    await data.updateCompanyOnboarding({
      user_id: user.id,
      categories_served: input.category_ids,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function completeOnboardingAction(): Promise<OnboardingStepResult> {
  try {
    const user = await requireUser();
    await data.completeOnboarding(user.id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Complete failed" };
  }
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionCookie();
  if (token) await data.signOut(token);
  await clearSessionCookie();
}
