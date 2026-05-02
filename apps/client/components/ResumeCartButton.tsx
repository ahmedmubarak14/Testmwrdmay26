"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { resumeCartAction } from "@/app/actions/cart";

export function ResumeCartButton({ cart_id }: { cart_id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await resumeCartAction(cart_id);
          if (res.ok) router.push("/cart");
        });
      }}
      className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? "Resuming…" : "Resume"}
    </button>
  );
}
