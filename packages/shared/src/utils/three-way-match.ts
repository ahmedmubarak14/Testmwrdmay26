// Three-way matching: PO × GRN × Invoice within 2% variance.
// Discrepancy auto-holds the invoice and flags it to backoffice.

import type { GRN, Invoice, PO } from "../types";

const TOLERANCE_PCT = 2;

export interface ThreeWayMatchResult {
  matches: boolean;
  variance_pct: number;
  discrepancies: string[];
}

export function matchPOGRNInvoice(
  po: PO,
  grn: GRN,
  invoice: Invoice,
): ThreeWayMatchResult {
  const discrepancies: string[] = [];

  const grnReceivedTotal = grn.items.reduce((sum, item) => {
    const poItem = po.items.find((p) => p.id === item.po_item_id);
    if (!poItem) {
      discrepancies.push(`GRN item ${item.id} references unknown PO item ${item.po_item_id}`);
      return sum;
    }
    return sum + item.qty_received * poItem.unit_price_sar;
  }, 0);

  const poTotal = po.total_sar;
  const invoiceTotal = invoice.total_sar;

  for (const poItem of po.items) {
    const grnItem = grn.items.find((g) => g.po_item_id === poItem.id);
    if (!grnItem) {
      discrepancies.push(`PO item ${poItem.id} not received on GRN`);
      continue;
    }
    if (grnItem.qty_received < poItem.qty) {
      discrepancies.push(
        `PO item ${poItem.id}: ordered ${poItem.qty}, received ${grnItem.qty_received}`,
      );
    }
    if (grnItem.condition !== "ok") {
      discrepancies.push(`PO item ${poItem.id}: condition ${grnItem.condition}`);
    }
  }

  const denominator = poTotal === 0 ? 1 : Math.max(poTotal, invoiceTotal, grnReceivedTotal);
  const maxDelta = Math.max(
    Math.abs(poTotal - invoiceTotal),
    Math.abs(poTotal - grnReceivedTotal),
    Math.abs(invoiceTotal - grnReceivedTotal),
  );
  const variance_pct = (maxDelta / denominator) * 100;

  if (variance_pct > TOLERANCE_PCT) {
    discrepancies.push(
      `Total variance ${variance_pct.toFixed(2)}% exceeds tolerance ${TOLERANCE_PCT}%`,
    );
  }

  return {
    matches: discrepancies.length === 0,
    variance_pct: Math.round(variance_pct * 100) / 100,
    discrepancies,
  };
}
