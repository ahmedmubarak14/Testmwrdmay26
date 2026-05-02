"use client";

import { useState, useTransition } from "react";

import { createDNAction } from "@/app/actions/offers";

interface POItem {
  po_item_id: string;
  description: string;
  qty: number;
}

interface Props {
  spo_id: string;
  items: POItem[];
}

const COURIERS = ["SMSA Express", "Saudi Post", "Aramex", "DHL", "FedEx", "Internal Fleet"];

export function DNForm({ spo_id, items }: Props) {
  const [dispatched, setDispatched] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.po_item_id, i.qty])),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        const courier = String(fd.get("courier") ?? "");
        const tracking = String(fd.get("tracking") ?? "");
        const expected = String(fd.get("expected") ?? "");
        if (!courier || !tracking || !expected) {
          setError("Courier, tracking number, and expected delivery date are required.");
          return;
        }
        startTransition(async () => {
          try {
            await createDNAction({
              spo_id,
              courier,
              tracking_number: tracking,
              expected_delivery_date: expected,
              items: items.map((i) => ({
                po_item_id: i.po_item_id,
                qty_dispatched: Number(dispatched[i.po_item_id] ?? 0),
              })),
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Submit failed");
          }
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Courier</label>
          <select
            name="courier"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— Select —</option>
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tracking number</label>
          <input
            name="tracking"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expected delivery date
          </label>
          <input
            type="date"
            name="expected"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-gray-900">Items dispatched</p>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="pb-2">Item</th>
              <th className="pb-2">Qty ordered</th>
              <th className="pb-2">Qty dispatched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((it) => (
              <tr key={it.po_item_id}>
                <td className="py-2 text-gray-700">{it.description}</td>
                <td className="py-2 text-gray-600">{it.qty}</td>
                <td className="py-2">
                  <input
                    type="number"
                    min={0}
                    max={it.qty}
                    value={dispatched[it.po_item_id] ?? 0}
                    onChange={(e) =>
                      setDispatched((prev) => ({
                        ...prev,
                        [it.po_item_id]: Number(e.target.value),
                      }))
                    }
                    className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Delivery Note"}
      </button>
    </form>
  );
}
