// Order approval workflow.
// CLAUDE.md: every order placed by a client member walks the approval chain.

import { v4 as uuid } from "uuid";

import type { ApprovalTask, ID, PO } from "../types";
import { computeApprovalChain } from "../utils/approval-chain";
import { store, nowISO } from "./store";
import { sendNotification } from "./notifications";

export async function listMyApprovalTasks(approver_user_id: ID): Promise<ApprovalTask[]> {
  return Array.from(store.approval_tasks.values()).filter(
    (t) => t.approver_user_id === approver_user_id && t.status === "pending",
  );
}

async function advance(po: PO, currentTask: ApprovalTask): Promise<void> {
  // Find the rest of the chain past current approver.
  const approvalNodes = Array.from(store.approval_nodes.values()).filter(
    (n) => n.company_id === po.client_company_id,
  );
  const rfq = po.rfq_id ? store.rfqs.get(po.rfq_id) : undefined;
  const startUserId = rfq?.created_by_user_id;
  if (!startUserId) {
    store.pos.set(po.id, { ...po, status: "confirmed" });
    return;
  }

  const fullChain = computeApprovalChain(approvalNodes, startUserId);
  const nextOrder = currentTask.order_in_chain + 1;
  if (nextOrder >= fullChain.length) {
    // Last approval in chain — confirm CPO and dispatch SPO.
    store.pos.set(po.id, { ...po, status: "confirmed" });
    // Find the matching SPO (same transaction_ref) and mark as confirmed.
    for (const candidate of store.pos.values()) {
      if (
        candidate.transaction_ref === po.transaction_ref &&
        candidate.type === "SPO"
      ) {
        store.pos.set(candidate.id, { ...candidate, status: "confirmed" });
        await sendNotification({
          user_id: candidate.supplier_company_id, // notification keyed to company in MVP
          type: "spo_received",
          title: "SPO received",
          body: `${candidate.po_number} has been issued to you.`,
        });
      }
    }
    return;
  }

  const nextApprover = fullChain[nextOrder]!;
  const next: ApprovalTask = {
    id: uuid(),
    po_id: po.id,
    approver_user_id: nextApprover,
    status: "pending",
    order_in_chain: nextOrder,
  };
  store.approval_tasks.set(next.id, next);
  await sendNotification({
    user_id: nextApprover,
    type: "approval_required",
    title: "Approval required",
    body: `${po.po_number} is awaiting your approval.`,
  });
}

export async function approveOrder(task_id: ID, note?: string): Promise<void> {
  const task = store.approval_tasks.get(task_id);
  if (!task) throw new Error("Approval task not found");
  if (task.status !== "pending") throw new Error("Task already decided");

  const updated: ApprovalTask = {
    ...task,
    status: "approved",
    decided_at: nowISO(),
    note,
  };
  store.approval_tasks.set(task_id, updated);

  const po = store.pos.get(task.po_id);
  if (!po) return;
  await advance(po, updated);
}

export async function rejectOrder(task_id: ID, note?: string): Promise<void> {
  const task = store.approval_tasks.get(task_id);
  if (!task) throw new Error("Approval task not found");
  if (task.status !== "pending") throw new Error("Task already decided");

  store.approval_tasks.set(task_id, {
    ...task,
    status: "rejected",
    decided_at: nowISO(),
    note,
  });

  const po = store.pos.get(task.po_id);
  if (po) {
    store.pos.set(po.id, { ...po, status: "cancelled" });
    // Cancel matching SPO too.
    for (const candidate of store.pos.values()) {
      if (
        candidate.transaction_ref === po.transaction_ref &&
        candidate.type === "SPO"
      ) {
        store.pos.set(candidate.id, { ...candidate, status: "cancelled" });
      }
    }
  }
}

export async function getApprovalChainStatus(po_id: ID): Promise<ApprovalTask[]> {
  return Array.from(store.approval_tasks.values())
    .filter((t) => t.po_id === po_id)
    .sort((a, b) => a.order_in_chain - b.order_in_chain);
}
