import Link from "next/link";

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";
import { DeprecateButton } from "@/components/DeprecateButton";

interface PageProps {
  searchParams: Promise<{ tab?: string; category_id?: string; q?: string; page?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === "categories" ? "categories" : "products";

  const categories = await data.listCategories();
  const tops = categories.filter((c) => c.parent_id === null);

  const products = await data.listMasterProducts({
    category_id: sp.category_id,
    search: sp.q,
    page: Number(sp.page ?? 1),
    page_size: 25,
  });

  // Aggregate offer counts. Phase 2 will expose a single bulk reader.
  const allSuppliers = await data.listSupplierCompanies();
  const allOffers: import("@mwrd/shared").Offer[] = [];
  for (const s of allSuppliers) {
    allOffers.push(...(await data.listOffersForSupplier(s.id)));
  }
  const activeOffersByProduct = new Map<string, number>();
  for (const o of allOffers) {
    if (o.status !== "active" || o.approval_status !== "approved") continue;
    activeOffersByProduct.set(
      o.master_product_id,
      (activeOffersByProduct.get(o.master_product_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Master Catalog Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Categories and master products are admin-owned. Suppliers attach offers.
          </p>
        </div>
        <Link
          href="/master-catalog/products/new"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Master Product
        </Link>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 text-sm">
          <Link
            href="/master-catalog?tab=products"
            className={tabClass(tab === "products")}
          >
            Master Products ({products.total})
          </Link>
          <Link
            href="/master-catalog?tab=categories"
            className={tabClass(tab === "categories")}
          >
            Categories ({categories.length})
          </Link>
        </nav>
      </div>

      {tab === "categories" ? (
        <ul className="rounded-lg border border-gray-200 bg-white text-sm">
          {tops.map((top) => {
            const subs = categories.filter((c) => c.parent_id === top.id);
            return (
              <li key={top.id} className="border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium text-gray-900">{top.name_en}</span>
                  <span className="text-[11px] text-gray-500">{subs.length} subs</span>
                </div>
                {subs.length > 0 ? (
                  <ul className="border-t border-gray-100">
                    {subs.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between bg-gray-50 px-6 py-1.5 text-gray-700"
                      >
                        <span>{s.name_en}</span>
                        <span className="text-[11px] text-gray-500">{s.slug}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <form className="flex flex-wrap gap-2 text-sm" action="" method="get">
            <input type="hidden" name="tab" value="products" />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search by name or code"
              className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <select
              name="category_id"
              defaultValue={sp.category_id ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">All categories</option>
              {tops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              Apply
            </button>
          </form>

          <p className="text-xs text-gray-500">
            {products.total} products · page {products.page} of{" "}
            {Math.max(1, Math.ceil(products.total / products.page_size))}
          </p>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Active offers</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.items.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono text-xs text-gray-900">
                      {p.master_product_code}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{p.name_en}</p>
                      <p className="text-[11px] text-gray-500">{p.name_ar}</p>
                    </td>
                    <td className="p-3 text-gray-700">
                      {activeOffersByProduct.get(p.id) ?? 0}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-right">
                      <DeprecateButton id={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function tabClass(active: boolean): string {
  return `inline-block border-b-2 px-1 pb-2 ${
    active
      ? "border-gray-900 font-semibold text-gray-900"
      : "border-transparent text-gray-500 hover:text-gray-900"
  }`;
}
