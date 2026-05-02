"use client";

import { useState, useTransition } from "react";

import { approveOfferAction, rejectOfferAction } from "@/app/actions/ops";

export function OfferApprovalActions({ offer_id }: { offer_id: string }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => approveOfferAction(offer_id))}
          title="Approve"
          className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          ✓
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowReject(true)}
          title="Reject"
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          ✕
        </button>
      </div>
      {showReject ? (
        <div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="block w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={pending || !reason}
            onClick={() => startTransition(async () => rejectOfferAction(offer_id, reason))}
            className="mt-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      ) : null}
    </div>
  );
}
