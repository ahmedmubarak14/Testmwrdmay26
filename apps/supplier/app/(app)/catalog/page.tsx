// Master catalog browse from supplier's POV.
// CLAUDE.md supplier blind: NO "X suppliers sell this" counter.
// Each card shows whether THIS supplier already has an offer.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

interface PageProps {
  searchParams: Promise<{ category_id?: string; q?: string; mine?: string; page?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await getViewer();
  const companyId = user.company_id ?? "";

  const categories = await data.listCategories();
  const tops = categories.filter((c) => c.parent_id === null);

  const products = await data.listMasterProducts({
    category_id: sp.category_id,
    search: sp.q,
    page: Number(sp.page ?? 1),
    page_size: 25,
  });

  const myOffers = await data.listOffersForSupplier(companyId);
  const myOfferByProduct = new Map(myOffers.map((o) => [o.master_product_id, o]));

  const filtered =
    sp.mine === "1"
      ? products.items.filter((p) => myOfferByProduct.has(p.id))
      : products.items;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Browse Master Catalog</h1>
        <p className="mt-1 text-sm text-gray-600">
          Find products you can sell and add an offer to your rate card.
        </p>
      </div>

      <form className="flex flex-wrap gap-2 text-sm" action="" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search master catalog"
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
        <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs">
          <input type="checkbox" name="mine" value="1" defaultChecked={sp.mine === "1"} />
          My offers only
        </label>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
        >
          Apply
        </button>
      </form>

      <p className="text-xs text-gray-500">
        {filtered.length} of {products.total} products
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const offer = myOfferByProduct.get(p.id);
          return (
            <div
              key={p.id}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-4"
            >
              <Link href={`/catalog/products/${p.id}`}>
                <div className="aspect-square w-full rounded bg-gray-100" />
                <p className="mt-3 text-sm font-medium text-gray-900">{p.name_en}</p>
                <p className="mt-1 text-[11px] font-mono text-gray-500">
                  {p.master_product_code}
                </p>
              </Link>
              <div className="mt-3 flex-1" />
              {offer ? (
                <Link
                  href={`/catalog/products/${p.id}`}
                  className="mt-2 rounded-md border border-gray-300 bg-white py-1.5 text-center text-xs font-medium hover:bg-gray-50"
                >
                  Edit Offer ({offer.approval_status})
                </Link>
              ) : (
                <Link
                  href={`/catalog/products/${p.id}`}
                  className="mt-2 rounded-md bg-blue-600 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-700"
                >
                  Sell this Product
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
