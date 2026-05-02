// RFQ detail with Details / Quotes tabs.
// Quotes view shows supplier platform_alias only, never real_name.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";
import { resolveSupplierAlias } from "@/components/SupplierAlias";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "details" ? "details" : "quotes";

  const rfq = await data.getRFQ(id);
  if (!rfq) notFound();

  const quotes = await data.listQuotesForRFQ(rfq.id);

  // Resolve supplier aliases (platform alias only).
  const aliasedQuotes = await Promise.all(
    quotes.map(async (q) => ({
      ...q,
      supplier_alias: await resolveSupplierAlias(q.supplier_company_id),
      total: q.items.reduce((s, i) => s + i.final_unit_price_sar * i.qty_available, 0),
    })),
  );

  // Enrich items with master products for description.
  const enrichedItems = await Promise.all(
    rfq.items.map(async (it) => ({
      it,
      product: it.master_product_id ? await data.getMasterProduct(it.master_product_id) : null,
    })),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs text-gray-500">{rfq.rfq_number}</p>
          <h1 className="text-2xl font-semibold text-gray-900">{rfq.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <StatusBadge status={rfq.status} />
            <span>Submitted {new Date(rfq.created_at).toLocaleDateString()}</span>
            <span>·</span>
            <span>{quotes.length} quote(s) received</span>
            <span>·</span>
            <span>Expires {new Date(rfq.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
        {quotes.length > 0 ? (
          <Link
            href={`/rfqs/${rfq.id}/compare`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Compare Line by Line
          </Link>
        ) : null}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 text-sm">
          <Link
            href={`/rfqs/${rfq.id}?tab=details`}
            className={tabClass(tab === "details")}
          >
            Details
          </Link>
          <Link href={`/rfqs/${rfq.id}?tab=quotes`} className={tabClass(tab === "quotes")}>
            Quotes Received
          </Link>
        </nav>
      </div>

      {tab === "details" ? (
        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Delivery city" value={rfq.delivery_city} />
            <Info label="Delivery date" value={new Date(rfq.delivery_date).toLocaleDateString()} />
            <Info label="Source" value={rfq.source} />
          </div>

          {rfq.description ? (
            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              {rfq.description}
            </div>
          ) : null}

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Items
            </h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Pack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrichedItems.map(({ it, product }) => (
                  <tr key={it.id}>
                    <td className="py-2">
                      <p className="font-medium text-gray-900">
                        {product ? product.name_en : it.free_text_name ?? "Custom item"}
                      </p>
                      {product ? (
                        <p className="text-[11px] font-mono text-gray-500">
                          {product.master_product_code}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500">{it.description}</p>
                      )}
                    </td>
                    <td className="py-2 text-gray-700">
                      {it.qty} {it.unit}
                    </td>
                    <td className="py-2 text-gray-700">{it.pack_type ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section>
          {aliasedQuotes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-sm text-gray-600">
                No quotes yet. Suppliers are still reviewing.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {aliasedQuotes.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {q.supplier_alias}{" "}
                      <span className="text-gray-400">★ 4.7</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Lead time {q.lead_time_days} days · Quote {q.quote_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      SAR {q.total.toFixed(2)}
                    </p>
                    <Link
                      href={`/rfqs/${rfq.id}/compare`}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                      View / Compare
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function tabClass(active: boolean): string {
  return `inline-block border-b-2 px-1 pb-2 ${
    active ? "border-gray-900 font-semibold text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"
  }`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
