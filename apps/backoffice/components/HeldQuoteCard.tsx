"use client";

import { useMemo, useState, useTransition } from "react";

import { approveAdminHeldQuoteAction } from "@/app/actions/ops";

interface Item {
  quote_item_id: string;
  display_name: string;
  qty: number;
  supplier_unit_price_sar: number;
  initial_final_unit_price_sar: number;
  lead_time_days: number;
}

interface Props {
  quote_id: string;
  quote_number: string;
  rfq_number: string;
  category_name: string;
  supplier_real_name: string;
  client_real_name: string;
  submitted_at: string | null;
  items: Item[];
}

export function HeldQuoteCard({
  quote_id,
  quote_number,
  rfq_number,
  category_name,
  supplier_real_name,
  client_real_name,
  submitted_at,
  items,
}: Props) {
  const [open, setOpen] = useState(false);
  const [marginPct, setMarginPct] = useState(() => {
    // Derive starting margin from existing supplier->final ratio.
    const first = items[0];
    if (!first) return 15;
    const ratio = first.initial_final_unit_price_sar / Math.max(first.supplier_unit_price_sar, 1);
    return Math.round((ratio - 1) * 1000) / 10;
  });
  const [pending, startTransition] = useTransition();
  const [overridden, setOverridden] = useState(false);

  const finalPrices = useMemo(() => {
    const m = 1 + marginPct / 100;
    const out: Record<string, number> = {};
    for (const it of items) out[it.quote_item_id] = Math.round(it.supplier_unit_price_sar * m * 100) / 100;
    return out;
  }, [marginPct, items]);

  const totals = useMemo(() => {
    const cost = items.reduce((s, it) => s + it.supplier_unit_price_sar * it.qty, 0);
    const finalTotal = items.reduce((s, it) => s + (finalPrices[it.quote_item_id] ?? 0) * it.qty, 0);
    return { cost, final: finalTotal, profit: finalTotal - cost };
  }, [finalPrices, items]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-xs text-gray-700">{quote_number}</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-700">For RFQ {rfq_number}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
            {category_name}
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
            Pending review
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {submitted_at ? new Date(submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} ▾
        </span>
      </button>

      {open ? (
        <div className="grid gap-4 border-t border-gray-200 p-3 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              From supplier
            </p>
            <p className="text-sm text-gray-900">{supplier_real_name}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              To client
            </p>
            <p className="text-sm text-gray-900">{client_real_name}</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-700">
              {items.map((it) => (
                <li key={it.quote_item_id}>
                  {it.display_name} — qty {it.qty} · cost SAR{" "}
                  {it.supplier_unit_price_sar.toFixed(2)} · lead {it.lead_time_days}d
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Margin
            </p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMarginPct((m) => Math.max(0, m - 1));
                  setOverridden(true);
                }}
                className="h-7 w-7 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                step="0.5"
                value={marginPct}
                onChange={(e) => {
                  setMarginPct(Number(e.target.value));
                  setOverridden(true);
                }}
                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-center text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setMarginPct((m) => m + 1);
                  setOverridden(true);
                }}
                className="h-7 w-7 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                +
              </button>
              <span className="text-xs text-gray-700">%</span>
              {overridden ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
                  Overridden
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
                  Category default
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-700">
              Cost SAR {totals.cost.toFixed(2)}
            </p>
            <p className="text-xs text-gray-700">
              Final SAR {totals.final.toFixed(2)}
            </p>
            <p className="text-xs text-emerald-700">
              Profit SAR {totals.profit.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Final client price
            </p>
            <p className="text-2xl font-semibold text-emerald-700">
              SAR {totals.final.toFixed(2)}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () =>
                  approveAdminHeldQuoteAction({
                    quote_id,
                    margin_overrides: finalPrices,
                  }),
                )
              }
              className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send to Client"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
