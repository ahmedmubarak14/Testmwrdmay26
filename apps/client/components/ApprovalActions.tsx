"use client";

import { useState, useTransition } from "react";

import { approveOrderAction, rejectOrderAction } from "@/app/actions/rfq";

export function ApprovalActions({ task_id }: { task_id: string }) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await approveOrderAction(task_id);
          });
        }}
        className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      {showReject ? (
        <div className="flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason"
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await rejectOrderAction(task_id, note || "rejected");
              });
            }}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm Reject
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowReject(true)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Reject…
        </button>
      )}
    </div>
  );
}
