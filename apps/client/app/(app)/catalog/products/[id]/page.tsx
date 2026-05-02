// Master product detail. CLAUDE.md quote-only rule:
//   NO PRICE FIELD. NO "available from N suppliers" counter.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { AddToRFQ } from "@/components/AddToRFQ";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const product = await data.getMasterProduct(id);
  if (!product) notFound();

  const allCategories = await data.listCategories();
  const cat = allCategories.find((c) => c.id === product.category_id);
  // Walk up to top-level category for breadcrumb.
  const topCat =
    cat?.parent_id == null ? cat : allCategories.find((c) => c.id === cat?.parent_id);

  // Determine express/market badges by checking if any active+approved offer
  // for this product has the given fulfillment_mode. We never reveal price
  // or supplier count.
  // We compute this via offers list, not a dedicated "summary" endpoint.
  const offers = await data.listOffersForSupplier(""); // empty: returns []
  // (We don't have a global offers reader on the client side that hides
  // per-supplier data; rely on summary flags only for now.)
  void offers; // intentionally unused; placeholder for v2 badge logic.

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500">
        <Link href="/catalog" className="hover:underline">
          Catalog
        </Link>{" "}
        /{" "}
        {topCat ? (
          <Link href={`/catalog/categories/${topCat.slug}`} className="hover:underline">
            {topCat.name_en}
          </Link>
        ) : null}{" "}
        / <span className="text-gray-900">{product.name_en}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="aspect-square w-full rounded-lg bg-gray-100" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-gray-100" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {cat ? (
            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
              {cat.name_en}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold text-gray-900">{product.name_en}</h1>
          <p className="font-mono text-xs text-gray-500">{product.master_product_code}</p>

          <div className="flex gap-2">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Marketplace
            </span>
          </div>

          <div>
            <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h2>
            <p className="mt-1 text-sm text-gray-700">{product.description_en}</p>
          </div>

          {Object.keys(product.specs).length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Specs
              </h2>
              <table className="mt-1 w-full text-sm">
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

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <AddToRFQ
              master_product_id={product.id}
              pack_types={product.pack_types}
            />
          </div>

          <p className="text-[11px] text-gray-500">
            Prices are not displayed on MWRD. Submit an RFQ and you&apos;ll receive
            quotes from verified suppliers.
          </p>
        </div>
      </div>
    </div>
  );
}
