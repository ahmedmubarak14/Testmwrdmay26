"use client";

import { useMemo, useState, useTransition } from "react";

import { submitQuoteAction } from "@/app/actions/offers";

interface ItemInput {
  quote_item_id: string;
  master_product_name: string;
  master_product_code: string;
  qty: number;
  pack_type: string;
  supplier_unit_price_sar: number;
  qty_available: number;
  lead_time_days: number;
  notes: string;
  declined: boolean;
}

interface Props {
  quote_id: string;
  is_auto_generated: boolean;
  initial_status: string;
  initial_valid_until: string;
  initial_notes: string;
  items: ItemInput[];
  vat_rate: number;
}

export function QuoteBuilder({
  quote_id,
  is_auto_generated,
  initial_status,
  initial_valid_until,
  initial_notes,
  items: initialItems,
  vat_rate,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState(initial_notes);
  const [validUntil, setValidUntil] = useState(initial_valid_until);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = items
      .filter((i) => !i.declined)
      .reduce((s, i) => s + i.supplier_unit_price_sar * i.qty_available, 0);
    const tax = (subtotal + shipping) * vat_rate;
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    };
  }, [items, shipping, vat_rate]);

  const updateItem = (id: string, patch: Partial<ItemInput>) =>
    setItems((prev) => prev.map((i) => (i.quote_item_id === id ? { ...i, ...patch } : i)));

  const onSend = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await submitQuoteAction({
        quote_id,
        notes,
        valid_until: validUntil,
        items: items.map((i) => ({
          quote_item_id: i.quote_item_id,
          supplier_unit_price_sar: Number(i.supplier_unit_price_sar),
          qty_available: Number(i.qty_available),
          lead_time_days: Number(i.lead_time_days),
          notes: i.notes,
          declined: i.declined,
        })),
      });
      if (res.ok) {
        setMessage("Sent for admin review.");
      } else {
        setMessage(res.error ?? "Submit failed");
      }
    });
  };

  const banner =
    is_auto_generated && initial_status === "draft_auto"
      ? "Auto-quote drafted from your rate card. Will send automatically unless you edit and confirm."
      : initial_status === "draft_manual"
        ? "No matching offers found in your rate card. Quote manually for items you can fulfill."
        : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-3">
        {banner ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            {banner}
          </div>
        ) : null}

        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Items
        </h2>

        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.quote_item_id}
              className={`rounded-lg border bg-white p-3 ${
                it.declined ? "opacity-60" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {it.master_product_name}
                  </p>
                  <p className="text-[11px] font-mono text-gray-500">
                    {it.master_product_code}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Asked: {it.qty} × {it.pack_type}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={it.declined}
                    onChange={(e) => updateItem(it.quote_item_id, { declined: e.target.checked })}
                  />
                  Decline this line
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NumberField
                  label="Unit Price (SAR)"
                  value={it.supplier_unit_price_sar}
                  step="0.01"
                  onChange={(v) => updateItem(it.quote_item_id, { supplier_unit_price_sar: v })}
                />
                <NumberField
                  label="Lead time (d)"
                  value={it.lead_time_days}
                  onChange={(v) => updateItem(it.quote_item_id, { lead_time_days: v })}
                />
                <NumberField
                  label="Qty available"
                  value={it.qty_available}
                  onChange={(v) => updateItem(it.quote_item_id, { qty_available: v })}
                />
                <div>
                  <label className="block text-[11px] text-gray-500">Notes</label>
                  <input
                    value={it.notes}
                    onChange={(e) => updateItem(it.quote_item_id, { notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-3 self-start rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Quote summary
        </h2>
        <Row label="Subtotal" value={totals.subtotal} />
        <div>
          <label className="block text-[11px] text-gray-500">Shipping (SAR)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={shipping}
            onChange={(e) => setShipping(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <Row label={`VAT (${(vat_rate * 100).toFixed(0)}%)`} value={totals.tax} />
        <Row label="Total" value={totals.total} bold />

        <div>
          <label className="block text-xs font-medium text-gray-700">Quote notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">Valid until</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={onSend}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send Quote Now"}
        </button>

        <p className="text-[11px] text-gray-500">
          Your quote will be reviewed by the admin before being sent to the client.
        </p>

        {message ? (
          <p className={`text-xs ${message.startsWith("Sent") ? "text-emerald-700" : "text-red-700"}`}>
            {message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] text-gray-500">{label}</label>
      <input
        type="number"
        min={0}
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
      />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">SAR {value.toFixed(2)}</span>
    </div>
  );
}
