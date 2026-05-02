"use client";

import { useState, useTransition } from "react";

import type { FulfillmentMode, PackType } from "@mwrd/shared";

import { saveOfferAction } from "@/app/actions/offers";

interface Props {
  master_product_id: string;
  pack_types: PackType[];
  initial?: {
    pack_type_pricing: { pack_type: PackType; supplier_cost_sar: number; min_order_qty: number }[];
    default_lead_time_days: number;
    available_quantity_estimate: number | null;
    auto_quote_enabled: boolean;
    fulfillment_mode: FulfillmentMode;
    supplier_internal_sku: string | null;
    supplier_notes: string | null;
    approval_status: "pending" | "approved" | "rejected";
  };
}

export function OfferForm({ master_product_id, pack_types, initial }: Props) {
  const [pricing, setPricing] = useState(() =>
    pack_types.map((pt) => {
      const existing = initial?.pack_type_pricing.find((x) => x.pack_type === pt);
      return {
        pack_type: pt,
        supplier_cost_sar: existing?.supplier_cost_sar ?? 0,
        min_order_qty: existing?.min_order_qty ?? 1,
      };
    }),
  );
  const [leadTime, setLeadTime] = useState(initial?.default_lead_time_days ?? 5);
  const [qtyEstimate, setQtyEstimate] = useState<number | null>(
    initial?.available_quantity_estimate ?? null,
  );
  const [autoQuote, setAutoQuote] = useState(initial?.auto_quote_enabled ?? true);
  const [mode, setMode] = useState<FulfillmentMode>(initial?.fulfillment_mode ?? "market");
  const [sku, setSku] = useState(initial?.supplier_internal_sku ?? "");
  const [notes, setNotes] = useState(initial?.supplier_notes ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await saveOfferAction({
            master_product_id,
            pack_type_pricing: pricing.map((p) => ({
              pack_type: p.pack_type,
              supplier_cost_sar: Number(p.supplier_cost_sar),
              min_order_qty: Number(p.min_order_qty),
            })),
            default_lead_time_days: leadTime,
            available_quantity_estimate: qtyEstimate,
            auto_quote_enabled: autoQuote,
            fulfillment_mode: mode,
            supplier_internal_sku: sku || null,
            supplier_notes: notes || null,
          });
          setMessage(res.ok ? "Offer saved" : res.error ?? "Save failed");
        });
      }}
      className="space-y-4"
    >
      {initial?.approval_status === "pending" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Your offer is awaiting admin approval before it&apos;s matched to RFQs.
        </div>
      ) : null}
      {initial?.approval_status === "rejected" ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          This offer was rejected. Edit and resubmit.
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">Pack-type pricing</p>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="pb-2">Pack</th>
              <th className="pb-2">Cost (SAR)</th>
              <th className="pb-2">Min order qty</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((p, i) => (
              <tr key={p.pack_type}>
                <td className="py-2 pr-2 text-gray-700">{p.pack_type}</td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={p.supplier_cost_sar}
                    onChange={(e) =>
                      setPricing((prev) => {
                        const copy = [...prev];
                        copy[i] = { ...copy[i]!, supplier_cost_sar: Number(e.target.value) };
                        return copy;
                      })
                    }
                    className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    value={p.min_order_qty}
                    onChange={(e) =>
                      setPricing((prev) => {
                        const copy = [...prev];
                        copy[i] = { ...copy[i]!, min_order_qty: Number(e.target.value) };
                        return copy;
                      })
                    }
                    className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Default lead time (days)</label>
          <input
            type="number"
            min={0}
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity estimate</label>
          <input
            type="number"
            min={0}
            value={qtyEstimate ?? ""}
            onChange={(e) => setQtyEstimate(e.target.value === "" ? null : Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700">Fulfillment mode</legend>
        <div className="mt-2 flex gap-4 text-sm">
          {(["express", "market"] as const).map((m) => (
            <label key={m} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              {m === "express" ? "Express" : "Marketplace"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Supplier internal SKU</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoQuote}
          onChange={(e) => setAutoQuote(e.target.checked)}
        />
        Auto-quote enabled
      </label>

      {message ? (
        <p className={`text-xs ${message.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : initial ? "Save Offer" : "Create Offer"}
      </button>
    </form>
  );
}
