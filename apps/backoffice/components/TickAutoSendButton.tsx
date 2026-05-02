"use client";

import { useTransition } from "react";

import { tickAutoSendAction } from "@/app/actions/ops";

export function TickAutoSendButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => tickAutoSendAction())}
      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
    >
      {pending ? "Ticking…" : "Tick auto-send queue (testing)"}
    </button>
  );
}
