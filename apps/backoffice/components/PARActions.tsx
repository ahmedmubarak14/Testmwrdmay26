"use client";

import { useState, useTransition } from "react";

import type { PackType } from "@mwrd/shared";

import { approvePARAction, rejectPARAction } from "@/app/actions/ops";

interface Props {
  par_id: string;
  proposed: {
    name_en: string;
    name_ar: string;
    description: string;
    category_id: string;
    specs: Record<string, string>;
  };
}

export function PARActions({ par_id, proposed }: Props) {
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("approve")}
          className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
        >
          Approve &amp; Create
        </button>
        <button
          type="button"
          onClick={() => setMode("reject")}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div className="space-y-2">
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason"
          className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || !reason}
            onClick={() => startTransition(async () => rejectPARAction(par_id, reason))}
            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm Reject
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Approve mode — show form pre-filled from PAR; admin can edit.
  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await approvePARAction({
            par_id,
            master_product: {
              name_en: String(fd.get("name_en") ?? proposed.name_en),
              name_ar: String(fd.get("name_ar") ?? proposed.name_ar),
              description_en: String(fd.get("description") ?? proposed.description),
              description_ar: String(fd.get("description") ?? proposed.description),
              category_id: String(fd.get("category_id") ?? proposed.category_id),
              specs: proposed.specs,
              pack_types: ["Each", "Box"] as PackType[],
              default_unit: "piece",
            },
          });
        });
      }}
      className="mt-2 space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2"
    >
      <input
        name="name_en"
        defaultValue={proposed.name_en}
        className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
      />
      <input
        name="name_ar"
        defaultValue={proposed.name_ar}
        className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
      />
      <textarea
        name="description"
        rows={2}
        defaultValue={proposed.description}
        className="block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
      />
      <input
        name="category_id"
        defaultValue={proposed.category_id}
        className="block w-full rounded-md border border-gray-300 px-2 py-1 font-mono text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Confirm &amp; Create Master Product"}
        </button>
        <button
          type="button"
          onClick={() => setMode("idle")}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
