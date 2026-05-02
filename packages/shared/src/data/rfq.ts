// RFQs, quotes, awarding, and auto-quote orchestration.
// CLAUDE.md: every reads strips counterparty real_name (anonymity rule).

import { v4 as uuid } from "uuid";

import type {
  ID,
  Offer,
  Quote,
  QuoteItem,
  RFQ,
  RFQItem,
} from "../types";
import { CreateRFQSchema } from "../validations";
import { generateDocNumber } from "../utils/numbers";
import { applyMargin, resolveMargin } from "../utils/margins";
import {
  generateAutoQuote,
  generateManualDraftQuote,
  matchOffersToRFQ,
  processAutoSendQueue,
  type SupplierMatch,
} from "../utils/auto-quote";
import { store, nowISO } from "./store";
import { sendNotification } from "./notifications";

// ─── RFQs ───────────────────────────────────────────────────────────────────

export interface CreateRFQInput {
  client_company_id: ID;
  created_by_user_id: ID;
  title: string;
  description: string;
  category_id?: ID | null;
  delivery_city: string;
  delivery_date: string;
  source: "catalog" | "custom_request";
  items: Array<{
    master_product_id?: ID | null;
    free_text_name?: string | null;
    description: string;
    qty: number;
    unit: string;
    pack_type?: "Each" | "Box" | "Carton" | null;
    specs_overrides?: string | null;
  }>;
}

export async function createRFQ(input: CreateRFQInput): Promise<RFQ> {
  const parsed = CreateRFQSchema.parse(input);
  const id = uuid();
  const items: RFQItem[] = parsed.items.map((it) => ({
    id: uuid(),
    rfq_id: id,
    master_product_id: it.master_product_id ?? null,
    free_text_name: it.free_text_name ?? null,
    description: it.description,
    qty: it.qty,
    unit: it.unit,
    pack_type: it.pack_type ?? null,
    specs_overrides: it.specs_overrides ?? null,
  }));

  const rfq: RFQ = {
    id,
    rfq_number: generateDocNumber("RFQ"),
    client_company_id: parsed.client_company_id,
    created_by_user_id: parsed.created_by_user_id,
    title: parsed.title,
    description: parsed.description,
    category_id: parsed.category_id ?? null,
    delivery_city: parsed.delivery_city,
    delivery_date: parsed.delivery_date,
    status: "open",
    source: parsed.source,
    items,
    created_at: nowISO(),
    expires_at: new Date(
      Date.now() + store.platform_settings.rfq_expiry_days * 24 * 3600 * 1000,
    ).toISOString(),
  };
  store.rfqs.set(id, rfq);

  // Trigger the auto-quote engine.
  await runAutoQuoteForRFQ(rfq);

  return rfq;
}

export async function listRFQsForClient(client_company_id: ID): Promise<RFQ[]> {
  return Array.from(store.rfqs.values()).filter(
    (r) => r.client_company_id === client_company_id,
  );
}

export interface SubmitCartAsRFQInput {
  user_id: ID;
  title: string;
  description: string;
  delivery_city: string;
  delivery_date: string;
  category_id?: ID | null;
}

export async function submitCartAsRFQ(input: SubmitCartAsRFQInput): Promise<RFQ> {
  const user = store.users.get(input.user_id);
  if (!user || !user.company_id) throw new Error("User has no company");
  const cart = Array.from(store.carts.values()).find(
    (c) => c.user_id === input.user_id && c.status === "active",
  );
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

  const rfqItems = cart.items.map((ci) => {
    const mp = store.master_products.get(ci.master_product_id);
    return {
      master_product_id: ci.master_product_id,
      free_text_name: null,
      description: mp?.description_en ?? "",
      qty: ci.qty,
      unit: mp?.default_unit ?? "piece",
      pack_type: ci.pack_type,
    };
  });

  const rfq = await createRFQ({
    client_company_id: user.company_id,
    created_by_user_id: input.user_id,
    title: input.title,
    description: input.description,
    category_id: input.category_id ?? null,
    delivery_city: input.delivery_city,
    delivery_date: input.delivery_date,
    source: "catalog",
    items: rfqItems,
  });

  // Clear the active cart.
  store.carts.delete(cart.id);
  return rfq;
}

export async function listOpenRFQsForSupplier(supplier_company_id: ID): Promise<RFQ[]> {
  // Supplier sees only RFQs they were matched to (via a quote).
  // CLAUDE.md "Supplier blind rules": no count of how many other suppliers received it.
  const supplierQuotes = Array.from(store.quotes.values()).filter(
    (q) => q.supplier_company_id === supplier_company_id,
  );
  const rfqIds = new Set(supplierQuotes.map((q) => q.rfq_id));
  return Array.from(store.rfqs.values()).filter(
    (r) => rfqIds.has(r.id) && (r.status === "open" || r.status === "quoted"),
  );
}

export async function getRFQ(id: ID): Promise<RFQ | null> {
  return store.rfqs.get(id) ?? null;
}

// ─── Auto-quote orchestration ───────────────────────────────────────────────

async function runAutoQuoteForRFQ(rfq: RFQ): Promise<void> {
  if (!store.platform_settings.auto_quote_globally_enabled) return;

  const allOffers: Offer[] = Array.from(store.offers.values());
  const matches: Map<ID, SupplierMatch> = matchOffersToRFQ(rfq, allOffers);

  // Suppliers in matching categories with NO matching offers get a manual draft.
  const matchedSupplierIds = new Set(matches.keys());
  const categorySuppliers = rfq.category_id
    ? Array.from(store.companies.values()).filter(
        (c) =>
          c.type === "supplier" &&
          c.categories_served?.includes(rfq.category_id!),
      )
    : [];

  for (const [supplierId, matchInfo] of matches.entries()) {
    const supplier = store.companies.get(supplierId);
    if (!supplier) continue;
    const quote = generateAutoQuote(rfq, supplierId, matchInfo, supplier);

    // Apply margin server-side now, so processAutoSendQueue knows the totals.
    const marginPct = rfq.category_id
      ? resolveMargin(
          Array.from(store.margins.values()),
          rfq.category_id,
          rfq.client_company_id,
        )
      : resolveMargin(
          Array.from(store.margins.values()),
          "no-category",
          rfq.client_company_id,
        );
    const itemsWithMargin: QuoteItem[] = quote.items.map((qi) => ({
      ...qi,
      final_unit_price_sar: applyMargin(qi.supplier_unit_price_sar, marginPct),
    }));
    const stored: Quote = { ...quote, items: itemsWithMargin };
    store.quotes.set(stored.id, stored);

    await sendNotification({
      user_id: supplierId,
      type: "auto_quote_drafted",
      title: "Auto-quote drafted",
      body: `A draft auto-quote is ready for ${rfq.rfq_number}.`,
    });
  }

  for (const supplier of categorySuppliers) {
    if (matchedSupplierIds.has(supplier.id)) continue;
    const draft = generateManualDraftQuote(rfq, supplier.id);
    store.quotes.set(draft.id, draft);
  }
}

// ─── Quotes ─────────────────────────────────────────────────────────────────

export async function listQuotesForSupplier(supplier_company_id: ID): Promise<Quote[]> {
  return Array.from(store.quotes.values()).filter(
    (q) => q.supplier_company_id === supplier_company_id,
  );
}

export async function listQuotesForRFQ(rfq_id: ID): Promise<Quote[]> {
  // Client view — only quotes that have actually been submitted to client.
  return Array.from(store.quotes.values()).filter(
    (q) => q.rfq_id === rfq_id && q.status === "submitted_to_client",
  );
}

export async function getQuote(id: ID): Promise<Quote | null> {
  return store.quotes.get(id) ?? null;
}

export async function editQuoteBeforeSend(
  quote_id: ID,
  patch: Partial<Pick<Quote, "items" | "notes" | "valid_until" | "lead_time_days">>,
): Promise<Quote> {
  const existing = store.quotes.get(quote_id);
  if (!existing) throw new Error("Quote not found");
  if (existing.status !== "draft_auto" && existing.status !== "draft_manual") {
    throw new Error("Quote can no longer be edited");
  }
  const updated: Quote = { ...existing, ...patch };
  store.quotes.set(quote_id, updated);
  return updated;
}

export async function sendQuoteNow(quote_id: ID): Promise<Quote> {
  const existing = store.quotes.get(quote_id);
  if (!existing) throw new Error("Quote not found");

  const total = existing.items.reduce(
    (sum, i) => sum + i.final_unit_price_sar * i.qty_available,
    0,
  );
  const threshold = store.platform_settings.auto_quote_admin_hold_threshold_sar;

  const newStatus =
    total > threshold ? "pending_admin_review" : "submitted_to_client";

  const updated: Quote = {
    ...existing,
    status: newStatus,
    supplier_reviewed_at: nowISO(),
    submitted_at: newStatus === "submitted_to_client" ? nowISO() : null,
    admin_held: newStatus === "pending_admin_review",
  };
  store.quotes.set(quote_id, updated);

  if (newStatus === "submitted_to_client") {
    const rfq = store.rfqs.get(existing.rfq_id);
    if (rfq) {
      await sendNotification({
        user_id: rfq.created_by_user_id,
        type: "quote_received",
        title: "Quote received",
        body: `A new quote arrived for ${rfq.rfq_number}.`,
      });
    }
  }

  return updated;
}

export async function approveAdminHeldQuote(quote_id: ID): Promise<Quote> {
  const existing = store.quotes.get(quote_id);
  if (!existing) throw new Error("Quote not found");
  if (existing.status !== "pending_admin_review") {
    throw new Error("Quote is not pending admin review");
  }
  const updated: Quote = {
    ...existing,
    status: "submitted_to_client",
    admin_held: false,
    submitted_at: nowISO(),
  };
  store.quotes.set(quote_id, updated);
  return updated;
}

// ─── Auto-send tick (called by background simulator / tests) ────────────────

export async function tickAutoSend(now: Date = new Date()): Promise<void> {
  const drafts = Array.from(store.quotes.values()).filter((q) => q.status === "draft_auto");
  const outcome = processAutoSendQueue(
    drafts,
    now,
    store.platform_settings.auto_quote_admin_hold_threshold_sar,
  );

  for (const q of outcome.to_send_to_client) {
    store.quotes.set(q.id, {
      ...q,
      status: "submitted_to_client",
      submitted_at: nowISO(),
      supplier_reviewed_at: nowISO(),
    });
  }
  for (const q of outcome.to_hold_for_admin) {
    store.quotes.set(q.id, {
      ...q,
      status: "pending_admin_review",
      admin_held: true,
      supplier_reviewed_at: nowISO(),
    });
  }
}
