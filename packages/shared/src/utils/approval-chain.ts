// Approval chain walking + cycle detection.
// CLAUDE.md rule: setDirectApprover MUST reject configs where A approves B
// who eventually approves A.

import type { ApprovalNode, ID } from "../types";

export function computeApprovalChain(
  approvalNodes: ApprovalNode[],
  startUserId: ID,
): ID[] {
  const chain: ID[] = [];
  const visited = new Set<ID>();
  let currentUserId: ID | null = startUserId;

  while (currentUserId !== null) {
    if (visited.has(currentUserId)) {
      throw new Error(
        `Cycle detected in approval chain at user ${currentUserId}`,
      );
    }
    visited.add(currentUserId);

    const node = approvalNodes.find((n) => n.member_user_id === currentUserId);
    const approver: ID | null = node?.direct_approver_user_id ?? null;
    if (approver === null) break;
    chain.push(approver);
    currentUserId = approver;
  }

  return chain;
}

export function detectCycle(
  approvalNodes: ApprovalNode[],
  proposedMemberId: ID,
  proposedApproverId: ID,
): boolean {
  if (proposedMemberId === proposedApproverId) return true;

  // Walk up from the proposed approver. If we reach the proposed member,
  // a cycle would form.
  const visited = new Set<ID>();
  let currentUserId: ID | null = proposedApproverId;
  while (currentUserId !== null) {
    if (currentUserId === proposedMemberId) return true;
    if (visited.has(currentUserId)) {
      // An existing cycle independent of this change — be safe and reject.
      return true;
    }
    visited.add(currentUserId);
    const node = approvalNodes.find((n) => n.member_user_id === currentUserId);
    currentUserId = node?.direct_approver_user_id ?? null;
  }

  return false;
}
