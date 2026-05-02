// Backoffice operations: leads, KYC queue, users, margins, audit, quote queues.

import { v4 as uuid } from "uuid";

import type {
  AuditLog,
  Company,
  ID,
  Margin,
  Quote,
  User,
} from "../types";
import { SetMarginSchema } from "../validations";
import { store, nowISO } from "./store";

// ─── Leads & KYC ────────────────────────────────────────────────────────────

export async function listLeadsQueue(): Promise<User[]> {
  return Array.from(store.users.values()).filter(
    (u) => u.status === "pending_callback",
  );
}

export async function listKycQueue(): Promise<Company[]> {
  return Array.from(store.companies.values()).filter(
    (c) => c.status === "pending_kyc",
  );
}

export async function approveKYC(company_id: ID): Promise<Company> {
  const c = store.companies.get(company_id);
  if (!c) throw new Error("Company not found");
  const updated: Company = { ...c, status: "active", updated_at: nowISO() };
  store.companies.set(company_id, updated);
  return updated;
}

export async function rejectKYC(company_id: ID): Promise<Company> {
  const c = store.companies.get(company_id);
  if (!c) throw new Error("Company not found");
  const updated: Company = { ...c, status: "suspended", updated_at: nowISO() };
  store.companies.set(company_id, updated);
  return updated;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function listAllUsers(): Promise<User[]> {
  return Array.from(store.users.values());
}

export async function getCompany(company_id: ID): Promise<Company | null> {
  return store.companies.get(company_id) ?? null;
}

// ─── Margins ────────────────────────────────────────────────────────────────

export async function setMargin(input: {
  scope: "global" | "category" | "client";
  scope_id?: ID;
  pct: number;
  updated_by_user_id: ID;
}): Promise<Margin> {
  const parsed = SetMarginSchema.parse({
    scope: input.scope,
    scope_id: input.scope_id,
    pct: input.pct,
  });

  // Replace existing margin at the same scope+scope_id.
  for (const [id, m] of store.margins.entries()) {
    const same =
      m.scope === parsed.scope &&
      ((m.scope === "global" && parsed.scope === "global") ||
        m.scope_id === parsed.scope_id);
    if (same) store.margins.delete(id);
  }

  const margin: Margin = {
    id: uuid(),
    scope: parsed.scope,
    scope_id: parsed.scope_id,
    pct: parsed.pct,
    updated_by_user_id: input.updated_by_user_id,
    updated_at: nowISO(),
  };
  store.margins.set(margin.id, margin);
  return margin;
}

export async function getMargin(args: {
  scope: "global" | "category" | "client";
  scope_id?: ID;
}): Promise<Margin | null> {
  for (const m of store.margins.values()) {
    if (m.scope === args.scope) {
      if (args.scope === "global") return m;
      if (m.scope_id === args.scope_id) return m;
    }
  }
  return null;
}

// ─── Audit log ──────────────────────────────────────────────────────────────

export async function listAuditLog(): Promise<AuditLog[]> {
  return Array.from(store.audit_log.values()).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}

export async function appendAuditLog(entry: Omit<AuditLog, "id" | "created_at">): Promise<AuditLog> {
  const log: AuditLog = { id: uuid(), created_at: nowISO(), ...entry };
  store.audit_log.set(log.id, log);
  return log;
}

// ─── Quote queues ───────────────────────────────────────────────────────────

export async function listAdminHeldQuotes(): Promise<Quote[]> {
  return Array.from(store.quotes.values()).filter(
    (q) => q.status === "pending_admin_review",
  );
}

export async function listPendingAutoQuotes(): Promise<Quote[]> {
  return Array.from(store.quotes.values()).filter((q) => q.status === "draft_auto");
}

// ─── Platform settings (admin write) ────────────────────────────────────────

export async function getPlatformSettings(): Promise<import("../types").PlatformSettings> {
  return store.platform_settings;
}

export async function updatePlatformSettings(
  patch: Partial<import("../types").PlatformSettings>,
): Promise<import("../types").PlatformSettings> {
  store.platform_settings = { ...store.platform_settings, ...patch };
  return store.platform_settings;
}

// ─── Companies / users readers used by backoffice ──────────────────────────

export async function listClientCompanies(): Promise<Company[]> {
  return Array.from(store.companies.values()).filter((c) => c.type === "client");
}

export async function listSupplierCompanies(): Promise<Company[]> {
  return Array.from(store.companies.values()).filter((c) => c.type === "supplier");
}

export async function listInternalUsers(): Promise<User[]> {
  return Array.from(store.users.values()).filter(
    (u) =>
      u.role === "admin" ||
      u.role === "ops" ||
      u.role === "finance" ||
      u.role === "cs",
  );
}

// ─── Margin manager (override per quote) ────────────────────────────────────

export async function setQuoteMarginOverride(
  quote_id: ID,
  finalUnitPrices: Record<ID, number>,
): Promise<void> {
  const quote = store.quotes.get(quote_id);
  if (!quote) throw new Error("Quote not found");
  store.quotes.set(quote_id, {
    ...quote,
    items: quote.items.map((qi) => ({
      ...qi,
      final_unit_price_sar: finalUnitPrices[qi.id] ?? qi.final_unit_price_sar,
    })),
  });
}

// ─── Logistics ──────────────────────────────────────────────────────────────

export async function listAllDNs(): Promise<import("../types").DN[]> {
  return Array.from(store.dns.values());
}
