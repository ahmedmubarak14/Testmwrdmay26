"use client";

import { useTransition } from "react";

import { deprecateMasterProductAction } from "@/app/actions/ops";

export function DeprecateButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Deprecate this master product? It will be hidden from new RFQs.")) {
          return;
        }
        startTransition(async () => deprecateMasterProductAction(id));
      }}
      className="text-xs text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
    >
      Deprecate
    </button>
  );
}
