// In-memory data store. Phase 1 ONLY — replaced by Supabase in Phase 2.
// All mutations go through the data API in this package; never touch Maps directly
// from outside packages/shared/src/data/.

import type {
  Address,
  ApprovalNode,
  ApprovalTask,
  AuditLog,
  Bundle,
  Cart,
  Category,
  Company,
  CompanyCatalog,
  CompanyMember,
  CompanyRole,
  DN,
  FavouriteList,
  GRN,
  ID,
  Invoice,
  Margin,
  MasterProduct,
  Notification,
  Offer,
  PO,
  PlatformSettings,
  ProductAdditionRequest,
  Quote,
  QuoteLineSelection,
  RFQ,
  User,
} from "../types";

export interface Session {
  user_id: ID;
  created_at: string;
  last_seen_at: string;
}

export interface PasswordRecord {
  user_id: ID;
  // Phase 1: stored as plain string. Phase 2 swaps to Supabase Auth — no
  // password hashing logic needed at all because Auth handles it.
  password: string;
}

export interface Store {
  users: Map<ID, User>;
  passwords: Map<ID, PasswordRecord>; // by user_id
  sessions: Map<string, Session>; // token -> session
  companies: Map<ID, Company>;
  company_members: Map<ID, CompanyMember>;
  company_roles: Map<ID, CompanyRole>;
  approval_nodes: Map<ID, ApprovalNode>;
  approval_tasks: Map<ID, ApprovalTask>;
  addresses: Map<ID, Address>;
  categories: Map<ID, Category>;
  master_products: Map<ID, MasterProduct>;
  master_product_seq: { value: number };
  bundles: Map<ID, Bundle>;
  offers: Map<ID, Offer>;
  product_addition_requests: Map<ID, ProductAdditionRequest>;
  favourites: Map<ID, FavouriteList>; // by user_id
  company_catalogs: Map<ID, CompanyCatalog>;
  carts: Map<ID, Cart>;
  rfqs: Map<ID, RFQ>;
  quotes: Map<ID, Quote>;
  quote_line_selections: Map<ID, QuoteLineSelection>;
  pos: Map<ID, PO>;
  dns: Map<ID, DN>;
  grns: Map<ID, GRN>;
  invoices: Map<ID, Invoice>;
  margins: Map<ID, Margin>;
  notifications: Map<ID, Notification>;
  audit_log: Map<ID, AuditLog>;
  platform_settings: PlatformSettings;
}

function emptyPlatformSettings(): PlatformSettings {
  return {
    id: "platform_settings",
    vat_rate: 0.15,
    default_lead_time_days: 7,
    rfq_expiry_days: 7,
    auto_quote_admin_hold_threshold_sar: 25_000,
    auto_quote_globally_enabled: true,
  };
}

export function makeEmptyStore(): Store {
  return {
    users: new Map(),
    passwords: new Map(),
    sessions: new Map(),
    companies: new Map(),
    company_members: new Map(),
    company_roles: new Map(),
    approval_nodes: new Map(),
    approval_tasks: new Map(),
    addresses: new Map(),
    categories: new Map(),
    master_products: new Map(),
    master_product_seq: { value: 0 },
    bundles: new Map(),
    offers: new Map(),
    product_addition_requests: new Map(),
    favourites: new Map(),
    company_catalogs: new Map(),
    carts: new Map(),
    rfqs: new Map(),
    quotes: new Map(),
    quote_line_selections: new Map(),
    pos: new Map(),
    dns: new Map(),
    grns: new Map(),
    invoices: new Map(),
    margins: new Map(),
    notifications: new Map(),
    audit_log: new Map(),
    platform_settings: emptyPlatformSettings(),
  };
}

// Singleton store. Module is imported once per Node process.
export const store: Store = makeEmptyStore();

// Test-only: reset and reseed. Used by the verification script.
export function resetStore(): void {
  const fresh = makeEmptyStore();
  Object.assign(store, fresh);
}

export function nowISO(): string {
  return new Date().toISOString();
}
