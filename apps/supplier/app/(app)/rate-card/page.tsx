// My Rate Card. Shows ONLY this supplier's offers.
// CLAUDE.md: supplier blind — no aggregate or competitor signals here.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";
import { AutoQuoteToggle } from "@/components/AutoQuoteToggle";
import { OfferRowActions } from "@/components/OfferRowActions";

interface PageProps {
  searchParams: Promise<{ status?: string; auto?: string; category_id?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await getViewer();
  const offers = await data.listOffersForSupplier(user.company_id ?? "");

  const filtered = offers.filter((o) => {
    if (sp.status === "active" && !(o.status === "active" && o.approval_status === "approved")) {
      return false;
    }
    if (sp.status === "inactive" && o.status !== "inactive") return false;
    if (sp.status === "pending" && o.approval_status !== "pending") return false;
    if (sp.auto === "on" && !o.auto_quote_enabled) return false;
    if (sp.auto === "off" && o.auto_quote_enabled) return false;
    return true;
  });

  // Resolve master products for display.
  const enriched = await Promise.all(
    filtered.map(async (o) => ({
      offer: o,
      product: await data.getMasterProduct(o.master_product_id),
    })),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Rate Card</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your active product offers and pricing.
          </p>
        </div>
        <Link
          href="/rate-card/settings"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Rate Card Settings
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(["", "active", "inactive", "pending"] as const).map((s) => (
          <Link
            key={s}
            href={s ? `/rate-card?status=${s}` : "/rate-card"}
            className={pillClass((sp.status ?? "") === s)}
          >
            {s ? s : "All"}
          </Link>
        ))}
        <span className="mx-2 text-gray-300">|</span>
        {(["", "on", "off"] as const).map((a) => (
          <Link
            key={a || "all-auto"}
            href={a ? `/rate-card?auto=${a}` : "/rate-card"}
            className={pillClass((sp.auto ?? "") === a)}
          >
            Auto-quote {a ? a : "all"}
          </Link>
        ))}
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No offers yet. Browse the master catalog to add products you sell.{" "}
          <Link href="/catalog" className="font-medium text-gray-900 underline">
            Browse Master Catalog
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Pack pricing (cost)</th>
                <th className="p-3">Lead time</th>
                <th className="p-3">Auto-quote</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enriched.map(({ offer, product }) =>
                product ? (
                  <tr key={offer.id}>
                    <td className="p-3">
                      <Link
                        href={`/catalog/products/${product.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {product.name_en}
                      </Link>
                      <p className="text-[11px] font-mono text-gray-500">
                        {product.master_product_code}
                      </p>
                    </td>
                    <td className="p-3 text-xs text-gray-700">
                      {offer.pack_type_pricing
                        .map((p) => `${p.pack_type}: SAR ${p.supplier_cost_sar.toFixed(2)}`)
                        .join(" · ")}
                    </td>
                    <td className="p-3 text-gray-600">{offer.default_lead_time_days}d</td>
                    <td className="p-3">
                      <AutoQuoteToggle
                        offer_id={offer.id}
                        initial={offer.auto_quote_enabled}
                      />
                    </td>
                    <td className="p-3">
                      <StatusBadge
                        status={
                          offer.approval_status === "pending"
                            ? "pending"
                            : offer.approval_status === "rejected"
                              ? "rejected"
                              : offer.status
                        }
                      />
                    </td>
                    <td className="p-3">
                      <OfferRowActions offer_id={offer.id} status={offer.status} />
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function pillClass(active: boolean): string {
  return `rounded-full border px-3 py-1 ${
    active
      ? "border-gray-900 bg-gray-900 text-white"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  }`;
}
