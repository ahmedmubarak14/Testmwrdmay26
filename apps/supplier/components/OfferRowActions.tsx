"use client";

import { useTransition } from "react";

import { pauseOfferAction, resumeOfferAction } from "@/app/actions/offers";

export function OfferRowActions({
  offer_id,
  status,
}: {
  offer_id: string;
  status: "active" | "inactive";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          if (status === "active") await pauseOfferAction(offer_id);
          else await resumeOfferAction(offer_id);
        });
      }}
      className="text-xs text-gray-700 underline-offset-2 hover:underline disabled:opacity-50"
    >
      {status === "active" ? "Pause" : "Resume"}
    </button>
  );
}
