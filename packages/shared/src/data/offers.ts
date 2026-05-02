// Supplier offers + product addition requests.
// Suppliers see ONLY their own offers. Anonymity rule applies on every read.

import { v4 as uuid } from "uuid";

import type { ID, Offer, ProductAdditionRequest } from "../types";
import {
  CreateOfferSchema,
  CreateProductAdditionRequestSchema,
} from "../validations";
import { store, nowISO } from "./store";

// ─── Offers ─────────────────────────────────────────────────────────────────

export async function listOffersForSupplier(supplier_company_id: ID): Promise<Offer[]> {
  return Array.from(store.offers.values()).filter(
    (o) => o.supplier_company_id === supplier_company_id,
  );
}

export async function findOfferByProduct(
  supplier_company_id: ID,
  master_product_id: ID,
): Promise<Offer | null> {
  for (const o of store.offers.values()) {
    if (
      o.supplier_company_id === supplier_company_id &&
      o.master_product_id === master_product_id
    ) {
      return o;
    }
  }
  return null;
}

export interface RateCardSettings {
  auto_quote_review_window?: import("../types").AutoQuoteReviewWindow;
  auto_quote_globally_enabled?: boolean;
  default_lead_time_pad_days?: number;
}

export async function updateRateCardSettings(
  supplier_company_id: ID,
  settings: RateCardSettings,
): Promise<void> {
  const company = store.companies.get(supplier_company_id);
  if (!company) throw new Error("Company not found");
  store.companies.set(supplier_company_id, {
    ...company,
    auto_quote_review_window:
      settings.auto_quote_review_window ?? company.auto_quote_review_window,
    auto_quote_globally_enabled:
      settings.auto_quote_globally_enabled ?? company.auto_quote_globally_enabled,
    default_lead_time_pad_days:
      settings.default_lead_time_pad_days ?? company.default_lead_time_pad_days,
    updated_at: new Date().toISOString(),
  });
}

export async function getOffer(id: ID): Promise<Offer | null> {
  return store.offers.get(id) ?? null;
}

export async function createOffer(
  input: Omit<Offer, "id" | "approval_status" | "created_at" | "updated_at">,
): Promise<Offer> {
  const parsed = CreateOfferSchema.parse(input);
  const id = uuid();
  const offer: Offer = {
    ...parsed,
    id,
    approval_status: "pending",
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.offers.set(id, offer);
  return offer;
}

export async function updateOffer(
  id: ID,
  patch: Partial<Omit<Offer, "id">>,
): Promise<Offer> {
  const existing = store.offers.get(id);
  if (!existing) throw new Error("Offer not found");
  const updated: Offer = { ...existing, ...patch, updated_at: nowISO() };
  store.offers.set(id, updated);
  return updated;
}

export async function toggleAutoQuote(id: ID, enabled: boolean): Promise<Offer> {
  return updateOffer(id, { auto_quote_enabled: enabled });
}

export async function pauseOffer(id: ID): Promise<Offer> {
  return updateOffer(id, { status: "inactive" });
}

export async function resumeOffer(id: ID): Promise<Offer> {
  return updateOffer(id, { status: "active" });
}

export async function approveOffer(id: ID): Promise<Offer> {
  return updateOffer(id, { approval_status: "approved" });
}

export async function rejectOffer(id: ID): Promise<Offer> {
  return updateOffer(id, { approval_status: "rejected" });
}

export async function listOfferApprovalQueue(): Promise<Offer[]> {
  return Array.from(store.offers.values()).filter((o) => o.approval_status === "pending");
}

// ─── Product Addition Requests ──────────────────────────────────────────────

export async function createProductAdditionRequest(input: {
  requested_by_user_id: ID;
  supplier_company_id: ID;
  proposed_name_en: string;
  proposed_name_ar: string;
  proposed_category_id: ID;
  proposed_description: string;
  proposed_specs: Record<string, string>;
  sample_images: string[];
  reason_for_addition: string;
  estimated_demand?: string | null;
}): Promise<ProductAdditionRequest> {
  const parsed = CreateProductAdditionRequestSchema.parse(input);
  const id = uuid();
  const par: ProductAdditionRequest = {
    id,
    requested_by_user_id: input.requested_by_user_id,
    supplier_company_id: parsed.supplier_company_id,
    proposed_name_en: parsed.proposed_name_en,
    proposed_name_ar: parsed.proposed_name_ar,
    proposed_category_id: parsed.proposed_category_id,
    proposed_description: parsed.proposed_description,
    proposed_specs: parsed.proposed_specs,
    sample_images: parsed.sample_images,
    reason_for_addition: parsed.reason_for_addition,
    estimated_demand: parsed.estimated_demand ?? null,
    status: "submitted",
    admin_notes: null,
    resulting_master_product_id: null,
    rejection_reason: null,
    reviewed_by_admin_id: null,
    created_at: nowISO(),
    decided_at: null,
  };
  store.product_addition_requests.set(id, par);
  return par;
}

export async function listMyProductAdditionRequests(
  user_id: ID,
): Promise<ProductAdditionRequest[]> {
  return Array.from(store.product_addition_requests.values()).filter(
    (p) => p.requested_by_user_id === user_id,
  );
}

export async function listAllProductAdditionRequests(): Promise<ProductAdditionRequest[]> {
  return Array.from(store.product_addition_requests.values());
}

export async function approveProductAdditionRequest(
  id: ID,
  admin_id: ID,
  resulting_master_product_id: ID,
): Promise<ProductAdditionRequest> {
  const existing = store.product_addition_requests.get(id);
  if (!existing) throw new Error("Request not found");
  const updated: ProductAdditionRequest = {
    ...existing,
    status: "approved",
    reviewed_by_admin_id: admin_id,
    resulting_master_product_id,
    decided_at: nowISO(),
  };
  store.product_addition_requests.set(id, updated);
  return updated;
}

export async function rejectProductAdditionRequest(
  id: ID,
  admin_id: ID,
  reason: string,
): Promise<ProductAdditionRequest> {
  const existing = store.product_addition_requests.get(id);
  if (!existing) throw new Error("Request not found");
  const updated: ProductAdditionRequest = {
    ...existing,
    status: "rejected",
    reviewed_by_admin_id: admin_id,
    rejection_reason: reason,
    decided_at: nowISO(),
  };
  store.product_addition_requests.set(id, updated);
  return updated;
}
