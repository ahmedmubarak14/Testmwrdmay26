// Line-by-line quote comparison matrix.
// CLAUDE.md anonymity rule: only platform_alias shown, never real_name.
// CLAUDE.md margin rule: client API responses never expose supplier_unit_price_sar
// or margin_pct. We only pass final_unit_price_sar to the client component.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { CompareMatrix } from "@/components/CompareMatrix";
import { resolveSupplierAlias } from "@/components/SupplierAlias";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const rfq = await data.getRFQ(id);
  if (!rfq) notFound();
  const quotes = await data.listQuotesForRFQ(rfq.id);

  // Build supplier columns. STRIP supplier_unit_price_sar before serialising.
  const suppliers = await Promise.all(
    quotes.map(async (q) => {
      const cells: Record<string, {
        quote_id: string;
        quote_item_id: string | null;
        unit_price: number;
        lead_time_days: number;
        declined: boolean;
      } | null> = {};
      for (const ri of rfq.items) {
        const qi = q.items.find((x) => x.rfq_item_id === ri.id) ?? null;
        cells[ri.id] = qi
          ? {
              quote_id: q.id,
              quote_item_id: qi.id,
              unit_price: qi.final_unit_price_sar, // server-applied margin
              lead_time_days: qi.lead_time_days,
              declined: qi.declined,
            }
          : null;
      }
      return {
        quote_id: q.id,
        supplier_alias: await resolveSupplierAlias(q.supplier_company_id),
        cells,
      };
    }),
  );

  const enrichedItems = await Promise.all(
    rfq.items.map(async (it) => {
      const product = it.master_product_id ? await data.getMasterProduct(it.master_product_id) : null;
      return {
        id: it.id,
        description: it.description,
        qty: it.qty,
        display_name: product?.name_en ?? it.free_text_name ?? "Custom item",
      };
    }),
  );

  if (suppliers.length === 0) {
    return (
      <div className="space-y-3">
        <Link href={`/rfqs/${rfq.id}`} className="text-xs text-gray-500 hover:underline">
          ← Back to RFQ
        </Link>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No quotes received yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Link href={`/rfqs/${rfq.id}`} className="text-xs text-gray-500 hover:underline">
        ← Back to RFQ
      </Link>

      <CompareMatrix
        rfq_id={rfq.id}
        rfq_number={rfq.rfq_number}
        delivery_date={rfq.delivery_date}
        rfq_items={enrichedItems}
        suppliers={suppliers}
      />
    </div>
  );
}
