"use client";

import { useState, useTransition } from "react";

import { markCallbackCompleteAction } from "@/app/actions/ops";

export function MarkCallbackButton({ user_id }: { user_id: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [activationLink, setActivationLink] = useState<string | null>(null);

  if (activationLink) {
    return (
      <div className="text-xs text-emerald-700">
        Activation email sent. Link:{" "}
        <code className="text-[10px]">{activationLink}</code>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
      >
        Mark Callback Complete
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (e.g. confirmed business details)"
        className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await markCallbackCompleteAction({ user_id, notes });
              if (res.ok && res.activation_token) {
                setActivationLink(`/activate?token=${res.activation_token}`);
              }
            })
          }
          className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
