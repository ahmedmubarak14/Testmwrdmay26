"use client";

import { useTransition } from "react";

import { approveKYCAction, rejectKYCAction } from "@/app/actions/ops";

export function KYCActions({ company_id }: { company_id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => approveKYCAction(company_id))}
        className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => rejectKYCAction(company_id))}
        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
