// Quote detail (supplier view).
// CLAUDE.md: rejected -> "Quote not accepted", no reason, no winner identity.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const quote = await data.getQuote(id);
  if (!quote) notFound();
  const rfq = await data.getRFQ(quote.rfq_id);

  // Resolve item display info.
  const items = await Promise.all(
    quote.items.map(async (qi) => {
      const ri = rfq?.items.find((x) => x.id === qi.rfq_item_id);
      const product = ri?.master_product_id
        ? await data.getMasterProduct(ri.master_product_id)
        : null;
      return {
        qi,
        display_name: product?.name_en ?? ri?.free_text_name ?? "Custom item",
      };
    }),
  );

  const total = quote.items.reduce(
    (s, i) => s + i.supplier_unit_price_sar * i.qty_available,
    0,
  );

  return (
    <div className="space-y-4">
      <Link href="/quotes" className="text-xs text-gray-500 hover:underline">
        ← Back to quotes
      </Link>

      <div>
        <p className="font-mono text-xs text-gray-500">{quote.quote_number}</p>
        <h1 className="text-2xl font-semibold text-gray-900">Quote detail</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {quote.status === "rejected" ? (
            <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-700">
              Quote not accepted
            </span>
          ) : (
            <StatusBadge status={quote.status} />
          )}
          <span>·</span>
          <span>RFQ {rfq?.rfq_number}</span>
        </div>
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="p-3">Item</th>
            <th className="p-3">Qty available</th>
            <th className="p-3">Unit price (SAR)</th>
            <th className="p-3">Lead time</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map(({ qi, display_name }) => (
            <tr key={qi.id} className={qi.declined ? "opacity-50" : ""}>
              <td className="p-3 text-gray-900">{display_name}</td>
              <td className="p-3 text-gray-600">{qi.qty_available}</td>
              <td className="p-3 text-gray-900">
                {qi.supplier_unit_price_sar.toFixed(2)}
              </td>
              <td className="p-3 text-gray-600">{qi.lead_time_days}d</td>
              <td className="p-3 text-xs text-gray-500">
                {qi.declined ? "Declined" : ""}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider text-gray-500">
              Total (excluding shipping/VAT)
            </td>
            <td className="p-3 font-semibold text-gray-900">SAR {total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {quote.status === "rejected" ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          Better luck next time. We don&apos;t share details about why a quote
          wasn&apos;t accepted, or who else competed.
        </div>
      ) : null}
    </div>
  );
}
