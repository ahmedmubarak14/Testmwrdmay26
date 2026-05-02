// Master product detail (supplier view). Read-only product info + offer form.
// Supplier blind: NO competitor pricing or supplier counts.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { OfferForm } from "@/components/OfferForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const product = await data.getMasterProduct(id);
  if (!product) notFound();

  const user = await getViewer();
  const offer = await data.findOfferByProduct(user.company_id ?? "", product.id);

  return (
    <div className="space-y-6">
      <Link href="/catalog" className="text-xs text-gray-500 hover:underline">
        ← Back to catalog
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="aspect-square w-full rounded-lg bg-gray-100" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-gray-100" />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-gray-900">{product.name_en}</h1>
          <p className="font-mono text-xs text-gray-500">{product.master_product_code}</p>

          <p className="text-sm text-gray-700">{product.description_en}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pack types
            </p>
            <p className="text-sm text-gray-900">{product.pack_types.join(" · ")}</p>
          </div>

          {Object.keys(product.specs).length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Specs
              </p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-1 pr-2 text-xs text-gray-500">{k}</td>
                      <td className="py-1 text-gray-700">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          {offer ? "Edit your offer" : "Sell this Product"}
        </h2>
        <OfferForm
          master_product_id={product.id}
          pack_types={product.pack_types}
          initial={
            offer
              ? {
                  pack_type_pricing: offer.pack_type_pricing,
                  default_lead_time_days: offer.default_lead_time_days,
                  available_quantity_estimate: offer.available_quantity_estimate,
                  auto_quote_enabled: offer.auto_quote_enabled,
                  fulfillment_mode: offer.fulfillment_mode,
                  supplier_internal_sku: offer.supplier_internal_sku,
                  supplier_notes: offer.supplier_notes,
                  approval_status: offer.approval_status,
                }
              : undefined
          }
        />
      </section>
    </div>
  );
}
