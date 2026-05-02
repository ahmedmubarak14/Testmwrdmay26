// Auto-quote engine. See CLAUDE.md "Auto-quote engine" section for rules.
// Pure function module — never reads from the data store.

import { v4 as uuid } from "uuid";
import type {
  AutoQuoteReviewWindow,
  Company,
  ID,
  Offer,
  PackType,
  Quote,
  QuoteItem,
  RFQ,
  RFQItem,
} from "../types";
import { generateDocNumber } from "./numbers";

export interface MatchedItem {
  rfq_item: RFQItem;
  offer: Offer;
}

export interface SupplierMatch {
  matched_items: MatchedItem[];
  unmatched_rfq_items: RFQItem[];
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

export function reviewWindowToMs(window: AutoQuoteReviewWindow): number {
  switch (window) {
    case "instant":
      return 0;
    case "30min":
      return 30 * MS_PER_MINUTE;
    case "2hr":
      return 2 * MS_PER_HOUR;
  }
}

export function matchOffersToRFQ(
  rfq: RFQ,
  offers: Offer[],
): Map<ID, SupplierMatch> {
  const eligibleOffers = offers.filter(
    (o) =>
      o.approval_status === "approved" &&
      o.status === "active" &&
      o.auto_quote_enabled,
  );

  // Index offers by master_product_id for fast lookup.
  const offersByProduct = new Map<ID, Offer[]>();
  for (const offer of eligibleOffers) {
    const list = offersByProduct.get(offer.master_product_id) ?? [];
    list.push(offer);
    offersByProduct.set(offer.master_product_id, list);
  }

  const result = new Map<ID, SupplierMatch>();

  for (const rfqItem of rfq.items) {
    if (!rfqItem.master_product_id) continue;
    const candidates = offersByProduct.get(rfqItem.master_product_id) ?? [];
    for (const offer of candidates) {
      const supplierId = offer.supplier_company_id;
      const bucket = result.get(supplierId) ?? {
        matched_items: [],
        unmatched_rfq_items: [],
      };
      bucket.matched_items.push({ rfq_item: rfqItem, offer });
      result.set(supplierId, bucket);
    }
  }

  // Compute unmatched per supplier (RFQ items with no offer from THIS supplier).
  for (const [supplierId, bucket] of result.entries()) {
    const matchedItemIds = new Set(bucket.matched_items.map((m) => m.rfq_item.id));
    bucket.unmatched_rfq_items = rfq.items.filter((i) => !matchedItemIds.has(i.id));
    result.set(supplierId, bucket);
  }

  return result;
}

function pickPackPrice(offer: Offer, requestedPack: PackType | null | undefined) {
  // Prefer the requested pack; fall back to the offer's first pack.
  const matched = requestedPack
    ? offer.pack_type_pricing.find((p) => p.pack_type === requestedPack)
    : undefined;
  return matched ?? offer.pack_type_pricing[0]!;
}

export function generateAutoQuote(
  rfq: RFQ,
  supplierId: ID,
  matched: SupplierMatch,
  supplier: Company,
  now: Date = new Date(),
): Quote {
  const reviewWindow: AutoQuoteReviewWindow =
    supplier.auto_quote_review_window ?? "30min";
  const auto_send_at = new Date(now.getTime() + reviewWindowToMs(reviewWindow)).toISOString();

  const quoteId = uuid();
  const items: QuoteItem[] = matched.matched_items.map(({ rfq_item, offer }) => {
    const packPrice = pickPackPrice(offer, rfq_item.pack_type ?? null);
    return {
      id: uuid(),
      quote_id: quoteId,
      rfq_item_id: rfq_item.id,
      offer_id: offer.id,
      supplier_unit_price_sar: packPrice.supplier_cost_sar,
      // Margin is applied in processAutoSendQueue, not here.
      final_unit_price_sar: 0,
      qty_available: rfq_item.qty,
      lead_time_days: offer.default_lead_time_days,
      notes: "",
      declined: false,
    };
  });

  const longestLead = items.reduce((max, item) => Math.max(max, item.lead_time_days), 0);

  return {
    id: quoteId,
    quote_number: generateDocNumber("Q", now),
    rfq_id: rfq.id,
    supplier_company_id: supplierId,
    status: "draft_auto",
    is_auto_generated: true,
    supplier_review_window: reviewWindow,
    supplier_reviewed_at: null,
    auto_send_at,
    admin_held: false,
    valid_until: new Date(now.getTime() + 7 * 24 * MS_PER_HOUR).toISOString(),
    lead_time_days: longestLead,
    items,
    notes: "",
    submitted_at: null,
  };
}

export function generateManualDraftQuote(
  rfq: RFQ,
  supplierId: ID,
  now: Date = new Date(),
): Quote {
  return {
    id: uuid(),
    quote_number: generateDocNumber("Q", now),
    rfq_id: rfq.id,
    supplier_company_id: supplierId,
    status: "draft_manual",
    is_auto_generated: false,
    supplier_review_window: "30min",
    supplier_reviewed_at: null,
    auto_send_at: null,
    admin_held: false,
    valid_until: new Date(now.getTime() + 7 * 24 * MS_PER_HOUR).toISOString(),
    lead_time_days: 0,
    items: [],
    notes: "",
    submitted_at: null,
  };
}

export interface AutoSendOutcome {
  to_send_to_client: Quote[];
  to_hold_for_admin: Quote[];
}

export function processAutoSendQueue(
  quotes: Quote[],
  now: Date,
  threshold_sar: number,
): AutoSendOutcome {
  const outcome: AutoSendOutcome = { to_send_to_client: [], to_hold_for_admin: [] };

  for (const q of quotes) {
    if (q.status !== "draft_auto") continue;
    if (!q.auto_send_at) continue;
    if (new Date(q.auto_send_at).getTime() > now.getTime()) continue;

    const total = q.items.reduce(
      (sum, item) => sum + item.final_unit_price_sar * item.qty_available,
      0,
    );

    if (total > threshold_sar) {
      outcome.to_hold_for_admin.push(q);
    } else {
      outcome.to_send_to_client.push(q);
    }
  }

  return outcome;
}
