// Awarding: convert accepted quotes into CPO + matching SPO + approval chain.

import { v4 as uuid } from "uuid";

import type {
  ApprovalTask,
  ID,
  PO,
  POItem,
  Quote,
  QuoteLineSelection,
} from "../types";
import { generateDocNumber } from "../utils/numbers";
import { computeApprovalChain } from "../utils/approval-chain";
import { store, nowISO } from "./store";
import { sendNotification } from "./notifications";

export interface AwardResult {
  cpo: PO;
  spo: PO;
}

function buildPOItems(po_id: ID, quote: Quote, selectedItemIds: Set<ID>, kind: "CPO" | "SPO"): POItem[] {
  return quote.items
    .filter((qi) => selectedItemIds.size === 0 || selectedItemIds.has(qi.id))
    .map((qi) => {
      const rfq = store.rfqs.get(quote.rfq_id);
      const rfqItem = rfq?.items.find((ri) => ri.id === qi.rfq_item_id);
      return {
        id: uuid(),
        po_id,
        master_product_id: rfqItem?.master_product_id ?? null,
        free_text_name: rfqItem?.free_text_name ?? null,
        description: rfqItem?.description ?? "",
        qty: qi.qty_available,
        pack_type: rfqItem?.pack_type ?? "Each",
        unit_price_sar:
          kind === "CPO" ? qi.final_unit_price_sar : qi.supplier_unit_price_sar,
        supplier_unit_cost_sar: kind === "SPO" ? qi.supplier_unit_price_sar : undefined,
      };
    });
}

async function createApprovalChainForCPO(cpo: PO): Promise<void> {
  const approvalNodes = Array.from(store.approval_nodes.values()).filter(
    (n) => n.company_id === cpo.client_company_id,
  );
  const orderingUserId = (() => {
    const rfq = cpo.rfq_id ? store.rfqs.get(cpo.rfq_id) : undefined;
    return rfq?.created_by_user_id ?? null;
  })();
  if (!orderingUserId) return;

  const chain = computeApprovalChain(approvalNodes, orderingUserId);
  if (chain.length === 0) {
    // No approver configured — auto-confirm.
    store.pos.set(cpo.id, { ...cpo, status: "confirmed" });
    return;
  }

  const firstApprover = chain[0]!;
  const task: ApprovalTask = {
    id: uuid(),
    po_id: cpo.id,
    approver_user_id: firstApprover,
    status: "pending",
    order_in_chain: 0,
  };
  store.approval_tasks.set(task.id, task);
  await sendNotification({
    user_id: firstApprover,
    type: "approval_required",
    title: "Approval required",
    body: `${cpo.po_number} is awaiting your approval.`,
  });
}

export async function acceptQuoteFullBasket(
  client_user_id: ID,
  quote_id: ID,
): Promise<AwardResult> {
  const quote = store.quotes.get(quote_id);
  if (!quote) throw new Error("Quote not found");
  return award(client_user_id, quote, new Set());
}

export async function acceptQuotesPerLine(
  client_user_id: ID,
  selections: { quote_id: ID; quote_item_id: ID }[],
): Promise<AwardResult[]> {
  const byQuote = new Map<ID, Set<ID>>();
  for (const s of selections) {
    const set = byQuote.get(s.quote_id) ?? new Set<ID>();
    set.add(s.quote_item_id);
    byQuote.set(s.quote_id, set);
  }

  const results: AwardResult[] = [];
  for (const [quoteId, itemIds] of byQuote.entries()) {
    const quote = store.quotes.get(quoteId);
    if (!quote) continue;
    results.push(await award(client_user_id, quote, itemIds));
  }
  return results;
}

async function award(
  client_user_id: ID,
  quote: Quote,
  selectedItemIds: Set<ID>,
): Promise<AwardResult> {
  const transactionRef = `TXN-${uuid().slice(0, 8)}`;
  const cpoId = uuid();
  const spoId = uuid();

  // Record line selections.
  const itemIdsArray =
    selectedItemIds.size === 0
      ? quote.items.map((i) => i.id)
      : Array.from(selectedItemIds);
  for (const qiId of itemIdsArray) {
    const sel: QuoteLineSelection = {
      id: uuid(),
      rfq_id: quote.rfq_id,
      quote_id: quote.id,
      quote_item_id: qiId,
      client_user_id,
      selected_at: nowISO(),
    };
    store.quote_line_selections.set(sel.id, sel);
  }

  const cpoItems = buildPOItems(cpoId, quote, selectedItemIds, "CPO");
  const spoItems = buildPOItems(spoId, quote, selectedItemIds, "SPO");

  const cpoTotal = cpoItems.reduce((sum, i) => sum + i.unit_price_sar * i.qty, 0);
  const spoTotal = spoItems.reduce((sum, i) => sum + i.unit_price_sar * i.qty, 0);

  const cpo: PO = {
    id: cpoId,
    po_number: generateDocNumber("CPO"),
    type: "CPO",
    transaction_ref: transactionRef,
    rfq_id: quote.rfq_id,
    source_quote_id: quote.id,
    source_quote_line_selections: itemIdsArray,
    client_company_id: store.rfqs.get(quote.rfq_id)?.client_company_id ?? "",
    supplier_company_id: quote.supplier_company_id,
    status: "awaiting_approval",
    total_sar: Math.round(cpoTotal * 100) / 100,
    items: cpoItems,
    created_at: nowISO(),
  };
  store.pos.set(cpoId, cpo);

  const spo: PO = {
    id: spoId,
    po_number: generateDocNumber("SPO"),
    type: "SPO",
    transaction_ref: transactionRef,
    rfq_id: quote.rfq_id,
    source_quote_id: quote.id,
    source_quote_line_selections: itemIdsArray,
    client_company_id: cpo.client_company_id,
    supplier_company_id: quote.supplier_company_id,
    status: "draft", // SPO sent to supplier only after CPO confirmed.
    total_sar: Math.round(spoTotal * 100) / 100,
    items: spoItems,
    created_at: nowISO(),
  };
  store.pos.set(spoId, spo);

  // Mark the originating quote.
  const partial = selectedItemIds.size > 0 && selectedItemIds.size < quote.items.length;
  store.quotes.set(quote.id, {
    ...quote,
    status: partial ? "partially_accepted" : "accepted",
  });

  // Update RFQ status.
  const rfq = store.rfqs.get(quote.rfq_id);
  if (rfq) {
    store.rfqs.set(rfq.id, {
      ...rfq,
      status: partial ? "partially_awarded" : "awarded",
    });
  }

  await createApprovalChainForCPO(cpo);

  return { cpo, spo };
}
