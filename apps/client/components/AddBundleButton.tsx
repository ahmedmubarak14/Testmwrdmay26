"use client";

import { useState, useTransition } from "react";

import { addBundleToCartAction } from "@/app/actions/cart";

export function AddBundleButton({ bundle_id }: { bundle_id: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setMessage(null);
            const res = await addBundleToCartAction(bundle_id);
            setMessage(res.ok ? "Bundle added to RFQ basket" : res.error ?? "Failed");
          });
        }}
        className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Bundle to RFQ"}
      </button>
      {message ? (
        <p className="text-xs text-gray-600" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
