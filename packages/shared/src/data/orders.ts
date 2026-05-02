// POs, DNs, GRNs, Invoices.

import { v4 as uuid } from "uuid";

import type { DN, DNItem, GRN, GRNItem, ID, Invoice, PO } from "../types";
import { generateDocNumber } from "../utils/numbers";
import { matchPOGRNInvoice } from "../utils/three-way-match";
import { createPaymentIntent } from "../utils/payments";
import { store, nowISO } from "./store";

// ─── POs ────────────────────────────────────────────────────────────────────

export async function listPOsForUser(args: {
  user_id: ID;
}): Promise<PO[]> {
  const user = store.users.get(args.user_id);
  if (!user) return [];
  if (user.role === "client") {
    return Array.from(store.pos.values()).filter(
      (p) => p.client_company_id === user.company_id && p.type === "CPO",
    );
  }
  if (user.role === "supplier") {
    return Array.from(store.pos.values()).filter(
      (p) => p.supplier_company_id === user.company_id && p.type === "SPO",
    );
  }
  return Array.from(store.pos.values());
}

export async function getPO(id: ID): Promise<PO | null> {
  return store.pos.get(id) ?? null;
}

// ─── Delivery notes ─────────────────────────────────────────────────────────

export async function createDN(input: {
  spo_id: ID;
  courier: string;
  tracking_number: string;
  expected_delivery_date: string;
  items: { po_item_id: ID; qty_dispatched: number }[];
}): Promise<DN> {
  const spo = store.pos.get(input.spo_id);
  if (!spo || spo.type !== "SPO") throw new Error("SPO not found");

  const id = uuid();
  const items: DNItem[] = input.items.map((it) => ({
    id: uuid(),
    dn_id: id,
    po_item_id: it.po_item_id,
    qty_dispatched: it.qty_dispatched,
  }));
  const dn: DN = {
    id,
    dn_number: generateDocNumber("DN"),
    spo_id: input.spo_id,
    courier: input.courier,
    tracking_number: input.tracking_number,
    dispatch_date: nowISO(),
    expected_delivery_date: input.expected_delivery_date,
    items,
  };
  store.dns.set(id, dn);

  store.pos.set(spo.id, { ...spo, status: "in_transit" });
  // Mirror to matching CPO.
  for (const candidate of store.pos.values()) {
    if (
      candidate.transaction_ref === spo.transaction_ref &&
      candidate.type === "CPO"
    ) {
      store.pos.set(candidate.id, { ...candidate, status: "in_transit" });
    }
  }

  return dn;
}

// ─── Goods receipt notes ────────────────────────────────────────────────────

export async function createGRN(input: {
  cpo_id: ID;
  dn_id: ID;
  received_by_user_id: ID;
  items: { po_item_id: ID; qty_received: number; condition: "ok" | "damaged" | "partial" }[];
  notes?: string;
}): Promise<GRN> {
  const id = uuid();
  const items: GRNItem[] = input.items.map((it) => ({
    id: uuid(),
    grn_id: id,
    po_item_id: it.po_item_id,
    qty_received: it.qty_received,
    condition: it.condition,
  }));
  const grn: GRN = {
    id,
    grn_number: generateDocNumber("GRN"),
    cpo_id: input.cpo_id,
    dn_id: input.dn_id,
    received_by_user_id: input.received_by_user_id,
    received_at: nowISO(),
    items,
    notes: input.notes ?? "",
  };
  store.grns.set(id, grn);

  const cpo = store.pos.get(input.cpo_id);
  if (cpo) {
    store.pos.set(cpo.id, { ...cpo, status: "delivered" });
    for (const candidate of store.pos.values()) {
      if (
        candidate.transaction_ref === cpo.transaction_ref &&
        candidate.type === "SPO"
      ) {
        store.pos.set(candidate.id, { ...candidate, status: "delivered" });
      }
    }
  }
  return grn;
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export async function generateInvoice(input: {
  cpo_id: ID;
  grn_id: ID;
}): Promise<Invoice> {
  const cpo = store.pos.get(input.cpo_id);
  const grn = store.grns.get(input.grn_id);
  if (!cpo || !grn) throw new Error("CPO or GRN not found");

  // Need a draft invoice candidate for matching.
  const provisional: Invoice = {
    id: "candidate",
    invoice_number: "candidate",
    cpo_id: cpo.id,
    grn_id: grn.id,
    total_sar: cpo.total_sar,
    vat_amount_sar: Math.round(cpo.total_sar * store.platform_settings.vat_rate * 100) / 100,
    status: "draft",
    issue_date: nowISO(),
    due_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  };

  const match = matchPOGRNInvoice(cpo, grn, provisional);

  const id = uuid();
  const invoice: Invoice = {
    ...provisional,
    id,
    invoice_number: generateDocNumber("INV"),
    status: match.matches ? "issued" : "draft",
  };
  store.invoices.set(id, invoice);

  return invoice;
}

export async function recordPayment(
  invoice_id: ID,
  payment_method: string,
): Promise<Invoice> {
  const invoice = store.invoices.get(invoice_id);
  if (!invoice) throw new Error("Invoice not found");
  const intent = await createPaymentIntent(invoice_id, invoice.total_sar, payment_method);
  const updated: Invoice = {
    ...invoice,
    status: "paid",
    payment_intent_id: intent.intent_id,
  };
  store.invoices.set(invoice_id, updated);

  // Mark CPO/SPO as completed.
  const cpo = store.pos.get(invoice.cpo_id);
  if (cpo) {
    store.pos.set(cpo.id, { ...cpo, status: "completed" });
    for (const candidate of store.pos.values()) {
      if (
        candidate.transaction_ref === cpo.transaction_ref &&
        candidate.type === "SPO"
      ) {
        store.pos.set(candidate.id, { ...candidate, status: "completed" });
      }
    }
  }
  return updated;
}
