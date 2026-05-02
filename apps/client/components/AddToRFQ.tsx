"use client";

import { useState, useTransition } from "react";

import type { PackType } from "@mwrd/shared";

import {
  addToCartAction,
  toggleFavouriteAction,
} from "@/app/actions/cart";

interface AddToRFQProps {
  master_product_id: string;
  pack_types: PackType[];
}

export function AddToRFQ({ master_product_id, pack_types }: AddToRFQProps) {
  const [qty, setQty] = useState(1);
  const [packType, setPackType] = useState<PackType>(pack_types[0] ?? "Each");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-700">Pack type</label>
        <select
          value={packType}
          onChange={(e) => setPackType(e.target.value as PackType)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {pack_types.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700">Quantity</label>
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-8 w-8 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm"
          />
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="h-8 w-8 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              setMessage(null);
              const res = await toggleFavouriteAction(master_product_id);
              setMessage(res.ok ? "Updated favourites" : res.error ?? "Failed");
            });
          }}
          className="rounded-md border border-gray-300 bg-white py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          ☆ Favourite
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              setMessage(null);
              const res = await addToCartAction({
                master_product_id,
                qty,
                pack_type: packType,
              });
              setMessage(
                res.ok ? `Added ${qty} × ${packType} to RFQ basket` : res.error ?? "Failed",
              );
            });
          }}
          className="rounded-md border border-gray-300 bg-white py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          + Add to Catalog
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setMessage(null);
            const res = await addToCartAction({
              master_product_id,
              qty,
              pack_type: packType,
            });
            setMessage(
              res.ok ? `Added ${qty} × ${packType} to RFQ basket` : res.error ?? "Failed",
            );
          });
        }}
        className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to RFQ"}
      </button>

      {message ? (
        <p className="text-xs text-gray-600" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
