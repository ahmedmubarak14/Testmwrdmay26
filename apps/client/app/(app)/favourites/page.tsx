// Favourites — quote-only: NO PRICES.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export default async function Page() {
  const user = await getViewer();
  const list = await data.getFavourites(user.id);
  const products = await Promise.all(list.master_product_ids.map((id) => data.getMasterProduct(id)));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Favourite List</h1>

      {list.master_product_ids.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No favourites yet. Tap ☆ on a product page to save it here.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products
            .filter((p): p is NonNullable<typeof p> => Boolean(p))
            .map((p) => (
              <Link
                key={p.id}
                href={`/catalog/products/${p.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-900"
              >
                <div className="aspect-square w-full rounded bg-gray-100" />
                <p className="mt-3 text-sm font-medium text-gray-900">{p.name_en}</p>
                <p className="mt-1 text-[11px] font-mono text-gray-500">
                  {p.master_product_code}
                </p>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
