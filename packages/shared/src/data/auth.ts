// Public auth functions. Backoffice has its OWN auth in apps/backoffice/lib/auth.ts.
// Phase 2 will replace this with Supabase Auth (separate `aud` for public vs backoffice).

import { v4 as uuid } from "uuid";

import type { Company, ID, User } from "../types";
import {
  ActivateAccountSchema,
  RegisterPublicSchema,
  SignInSchema,
} from "../validations";
import { generateClientAlias, generateSupplierAlias } from "../utils/aliases";
import { store, nowISO } from "./store";

export interface RegisterPublicInput {
  email: string;
  real_name: string;
  phone: string;
  role: "client" | "supplier";
  company_real_name: string;
  signup_intent?: string | null;
  expected_monthly_volume_sar?: number | null;
  language?: "en" | "ar";
}

export async function registerPublic(input: RegisterPublicInput): Promise<User> {
  const parsed = RegisterPublicSchema.parse(input);

  for (const u of store.users.values()) {
    if (u.email === parsed.email) {
      throw new Error("Email already registered");
    }
  }

  const companyId = uuid();
  const platformAlias =
    parsed.role === "client"
      ? generateClientAlias()
      : generateSupplierAlias(
          Array.from(store.companies.values())
            .filter((c) => c.type === "supplier")
            .map((c) => c.platform_alias),
        );

  const company: Company = {
    id: companyId,
    real_name: parsed.company_real_name,
    platform_alias: platformAlias,
    type: parsed.role,
    cr_number: null,
    vat_number: null,
    status: "pending_kyc",
    kyc_docs: [],
    signup_source: parsed.role === "client" ? "client_form" : "supplier_form",
    signup_intent: parsed.signup_intent ?? null,
    expected_monthly_volume_sar: parsed.expected_monthly_volume_sar ?? null,
    subscription_tier: "trial",
    onboarding_completed: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.companies.set(companyId, company);

  const userId = uuid();
  const user: User = {
    id: userId,
    email: parsed.email,
    role: parsed.role,
    real_name: parsed.real_name,
    phone: parsed.phone,
    platform_alias: platformAlias,
    company_id: companyId,
    status: "pending_callback",
    activation_status: "awaiting_callback",
    callback_notes: null,
    activation_token: null,
    language: parsed.language ?? "en",
    onboarding_completed: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.users.set(userId, user);
  // No password record yet — set during activateAccount.

  return user;
}

export async function markCallbackComplete(
  user_id: ID,
  notes: string | null = null,
): Promise<User> {
  const user = store.users.get(user_id);
  if (!user) throw new Error("User not found");

  const token = `act_${uuid()}`;
  const updated: User = {
    ...user,
    status: "callback_completed",
    activation_status: "callback_completed",
    callback_notes: notes,
    activation_token: token,
    updated_at: nowISO(),
  };
  store.users.set(user_id, updated);
  return updated;
}

export async function activateAccount(input: {
  activation_token: string;
  password: string;
}): Promise<User> {
  const parsed = ActivateAccountSchema.parse(input);
  const user = Array.from(store.users.values()).find(
    (u) => u.activation_token === parsed.activation_token,
  );
  if (!user) throw new Error("Invalid activation token");

  const updated: User = {
    ...user,
    status: "active",
    activation_status: "activated",
    activation_token: null,
    updated_at: nowISO(),
  };
  store.users.set(user.id, updated);
  store.passwords.set(user.id, { user_id: user.id, password: parsed.password });
  return updated;
}

export interface SignInResult {
  user: User;
  session_token: string;
}

export async function signIn(input: { email: string; password: string }): Promise<SignInResult> {
  const parsed = SignInSchema.parse(input);
  const user = Array.from(store.users.values()).find((u) => u.email === parsed.email);
  if (!user) throw new Error("Invalid credentials");
  const pwd = store.passwords.get(user.id);
  if (!pwd || pwd.password !== parsed.password) throw new Error("Invalid credentials");
  if (user.status !== "active") throw new Error("Account is not active");

  const token = `sess_${uuid()}`;
  store.sessions.set(token, { user_id: user.id, created_at: nowISO() });
  return { user, session_token: token };
}

export async function signOut(session_token: string): Promise<void> {
  store.sessions.delete(session_token);
}

export async function getCurrentUser(session_token: string): Promise<User | null> {
  const sess = store.sessions.get(session_token);
  if (!sess) return null;
  return store.users.get(sess.user_id) ?? null;
}

export async function completeOnboarding(user_id: ID): Promise<User> {
  const user = store.users.get(user_id);
  if (!user) throw new Error("User not found");
  const updated: User = { ...user, onboarding_completed: true, updated_at: nowISO() };
  store.users.set(user_id, updated);

  if (user.company_id) {
    const company = store.companies.get(user.company_id);
    if (company) {
      store.companies.set(company.id, {
        ...company,
        onboarding_completed: true,
        updated_at: nowISO(),
      });
    }
  }
  return updated;
}

export async function getUserByActivationToken(token: string): Promise<User | null> {
  for (const u of store.users.values()) {
    if (u.activation_token === token) return u;
  }
  return null;
}

export interface UpdateCompanyOnboardingInput {
  user_id: ID;
  cr_number?: string;
  vat_number?: string;
  full_address?: string;
  categories_served?: ID[];
}

// Used by the onboarding wizard to capture per-step input.
export async function updateCompanyOnboarding(
  input: UpdateCompanyOnboardingInput,
): Promise<User> {
  const user = store.users.get(input.user_id);
  if (!user || !user.company_id) throw new Error("User has no company");
  const company = store.companies.get(user.company_id);
  if (!company) throw new Error("Company not found");

  const updates: Partial<typeof company> = {};
  if (input.cr_number !== undefined) updates.cr_number = input.cr_number;
  if (input.vat_number !== undefined) updates.vat_number = input.vat_number;
  if (input.categories_served !== undefined) updates.categories_served = input.categories_served;
  if (input.full_address !== undefined) {
    // Stored on the company's first delivery address as a side-effect.
    // Phase 2: model this as a structured Address row.
    updates.signup_intent =
      (company.signup_intent ?? "") + ` | address=${input.full_address}`;
  }

  store.companies.set(company.id, {
    ...company,
    ...updates,
    updated_at: nowISO(),
  });
  return user;
}
