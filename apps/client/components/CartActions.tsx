"use client";

import { useState, useTransition } from "react";

import {
  removeFromCartAction,
  saveCartAction,
  updateCartItemAction,
} from "@/app/actions/cart";

export function RemoveCartItemButton({ cart_item_id }: { cart_item_id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await removeFromCartAction(cart_item_id);
        });
      }}
      className="text-xs text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
    >
      Remove
    </button>
  );
}

export function CartQtyStepper({
  cart_item_id,
  initialQty,
}: {
  cart_item_id: string;
  initialQty: number;
}) {
  const [qty, setQty] = useState(initialQty);
  const [pending, startTransition] = useTransition();

  const update = (newQty: number) => {
    setQty(newQty);
    startTransition(async () => {
      await updateCartItemAction(cart_item_id, { qty: newQty });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending || qty <= 1}
        onClick={() => update(qty - 1)}
        className="h-7 w-7 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        −
      </button>
      <span className="w-8 text-center text-sm">{qty}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => update(qty + 1)}
        className="h-7 w-7 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}

export function SaveCartButton({ cart_id }: { cart_id: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const name = window.prompt("Save this basket as:", "Untitled basket");
          if (!name) return;
          startTransition(async () => {
            const res = await saveCartAction(cart_id, name);
            setMessage(res.ok ? "Basket saved" : res.error ?? "Failed");
          });
        }}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        Save for Later
      </button>
      {message ? <p className="text-xs text-gray-600">{message}</p> : null}
    </>
  );
}
