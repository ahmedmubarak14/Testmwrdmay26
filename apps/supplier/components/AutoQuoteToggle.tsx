"use client";

import { useTransition } from "react";

import { toggleAutoQuoteAction } from "@/app/actions/offers";

export function AutoQuoteToggle({
  offer_id,
  initial,
}: {
  offer_id: string;
  initial: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <input
        type="checkbox"
        defaultChecked={initial}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            await toggleAutoQuoteAction(offer_id, next);
          });
        }}
      />
      Auto
    </label>
  );
}
