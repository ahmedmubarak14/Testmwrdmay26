"use client";

import { useMemo, useState, useTransition } from "react";

import { awardFullBasketAction, awardPerLineAction } from "@/app/actions/rfq";

interface RFQItem {
  id: string;
  description: string;
  qty: number;
  display_name: string;
}

interface QuoteCell {
  quote_id: string;
  quote_item_id: string | null;
  unit_price: number; // final_unit_price_sar (margin-applied)
  lead_time_days: number;
  declined: boolean;
}

interface SupplierColumn {
  quote_id: string;
  supplier_alias: string;
  cells: Record<string, QuoteCell | null>; // by rfq_item_id
}

interface Props {
  rfq_id: string;
  rfq_number: string;
  delivery_date: string;
  rfq_items: RFQItem[];
  suppliers: SupplierColumn[];
}

export function CompareMatrix({ rfq_id, rfq_number, delivery_date, rfq_items, suppliers }: Props) {
  void rfq_id;
  const [selections, setSelections] = useState<Record<string, string | null>>({}); // rfq_item_id -> quote_id
  const [pending, startTransition] = useTransition();

  const totalsBySupplier = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const sup of suppliers) {
      let t = 0;
      for (const ri of rfq_items) {
        if (selections[ri.id] !== sup.quote_id) continue;
        const cell = sup.cells[ri.id];
        if (cell && !cell.declined) t += cell.unit_price * ri.qty;
      }
      totals[sup.quote_id] = t;
    }
    return totals;
  }, [selections, suppliers, rfq_items]);

  const grandTotal = Object.values(totalsBySupplier).reduce((s, t) => s + t, 0);

  const onPerItemAward = () => {
    const sels: { quote_id: string; quote_item_id: string }[] = [];
    for (const ri of rfq_items) {
      const quoteId = selections[ri.id];
      if (!quoteId) continue;
      const sup = suppliers.find((s) => s.quote_id === quoteId);
      const cell = sup?.cells[ri.id];
      if (cell?.quote_item_id) sels.push({ quote_id: quoteId, quote_item_id: cell.quote_item_id });
    }
    if (sels.length === 0) {
      alert("Pick at least one supplier per item.");
      return;
    }
    startTransition(async () => {
      await awardPerLineAction(sels);
    });
  };

  const onFullBasketAward = (quote_id: string) => {
    startTransition(async () => {
      await awardFullBasketAction(quote_id);
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Compare Quotes for {rfq_number}
        </h2>
        <p className="text-xs text-gray-500">Required by {new Date(delivery_date).toLocaleDateString()}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Item</th>
              {suppliers.map((s) => (
                <th key={s.quote_id} className="p-3 text-center">
                  {s.supplier_alias}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rfq_items.map((ri) => (
              <tr key={ri.id}>
                <td className="p-3 align-top">
                  <p className="font-medium text-gray-900">{ri.display_name}</p>
                  <p className="text-[11px] text-gray-500">{ri.qty} units</p>
                </td>
                {suppliers.map((sup) => {
                  const cell = sup.cells[ri.id];
                  if (!cell) {
                    return (
                      <td key={sup.quote_id} className="p-3 text-center text-xs text-gray-400">
                        —
                      </td>
                    );
                  }
                  if (cell.declined) {
                    return (
                      <td key={sup.quote_id} className="p-3 text-center text-xs text-red-600">
                        Declined
                      </td>
                    );
                  }
                  const selected = selections[ri.id] === sup.quote_id;
                  const leadColour =
                    cell.lead_time_days <= 5
                      ? "text-emerald-700"
                      : cell.lead_time_days <= 10
                        ? "text-amber-700"
                        : "text-red-700";
                  return (
                    <td
                      key={sup.quote_id}
                      className={`p-3 text-center ${selected ? "bg-emerald-50" : ""}`}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        SAR {cell.unit_price.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-gray-500">per unit</p>
                      <p className={`text-[11px] ${leadColour}`}>
                        {cell.lead_time_days}d lead
                      </p>
                      <label className="mt-1 inline-flex items-center gap-1 text-[11px]">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [ri.id]: selected ? null : sup.quote_id,
                            }))
                          }
                        />
                        Select
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Grand total of selected lines</p>
            <p className="text-lg font-semibold text-gray-900">SAR {grandTotal.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onPerItemAward}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Submitting…" : "Confirm Per-Item Award"}
            </button>
            <select
              disabled={pending}
              onChange={(e) => {
                if (e.target.value) onFullBasketAward(e.target.value);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">Award entire RFQ to…</option>
              {suppliers.map((s) => (
                <option key={s.quote_id} value={s.quote_id}>
                  {s.supplier_alias}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
