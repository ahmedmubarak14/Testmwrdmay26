// Quote builder. Auto-draft pre-fills prices from the supplier's offers.
// Anonymity: client identity is NEVER shown beyond their alias (we don't show
// the alias on this page either — keep focus on the items).

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { QuoteBuilder } from "@/components/QuoteBuilder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id: rfqId } = await params;
  const rfq = await data.getRFQ(rfqId);
  if (!rfq) notFound();

  const user = await getViewer();
  const companyId = user.company_id ?? "";

  const myQuotes = await data.listQuotesForSupplier(companyId);
  const quote = myQuotes.find((q) => q.rfq_id === rfqId);
  if (!quote) {
    return (
      <div className="space-y-3">
        <Link href="/rfqs" className="text-xs text-gray-500 hover:underline">
          ← Back to RFQs
        </Link>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          You haven&apos;t been matched to this RFQ.
        </div>
      </div>
    );
  }

  // Build per-item display data.
  const items = await Promise.all(
    quote.items.map(async (qi) => {
      const ri = rfq.items.find((x) => x.id === qi.rfq_item_id);
      const product = ri?.master_product_id
        ? await data.getMasterProduct(ri.master_product_id)
        : null;
      return {
        quote_item_id: qi.id,
        master_product_name: product?.name_en ?? ri?.free_text_name ?? "Custom item",
        master_product_code: product?.master_product_code ?? "—",
        qty: ri?.qty ?? 0,
        pack_type: (ri?.pack_type ?? "Each") as string,
        supplier_unit_price_sar: qi.supplier_unit_price_sar,
        qty_available: qi.qty_available,
        lead_time_days: qi.lead_time_days,
        notes: qi.notes,
        declined: qi.declined,
      };
    }),
  );

  const settings = await data
    .listAllUsers()
    .then(() => null);
  void settings;

  // Pull VAT rate from PlatformSettings via store snapshot — getCompany covers
  // it; for now hardcode the 0.15 mirror that we seed.
  const vatRate = 0.15;

  return (
    <div className="space-y-4">
      <Link href="/rfqs" className="text-xs text-gray-500 hover:underline">
        ← Back to RFQs
      </Link>

      <div>
        <p className="font-mono text-xs text-gray-500">{quote.quote_number}</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          Quote for {rfq.rfq_number}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{rfq.title}</p>
      </div>

      <QuoteBuilder
        quote_id={quote.id}
        is_auto_generated={quote.is_auto_generated}
        initial_status={quote.status}
        initial_valid_until={new Date(quote.valid_until).toISOString().slice(0, 10)}
        initial_notes={quote.notes}
        items={items}
        vat_rate={vatRate}
      />
    </div>
  );
}
