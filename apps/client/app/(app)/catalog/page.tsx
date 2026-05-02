// Browse master catalog. CLAUDE.md quote-only rule: NO PRICES anywhere on
// this page. We only display product/category names, images, and badges.

import Link from "next/link";

import { data } from "@mwrd/shared";

export default async function CatalogPage() {
  const categories = await data.listCategories();
  const tops = categories.filter((c) => c.parent_id === null);
  const allProducts = (await data.listMasterProducts({ page: 1, page_size: 25 })).items;
  const bundles = await data.listBundles();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Browse Catalog</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add items to your basket to request quotes. We never publish prices —
            quotes arrive after you submit an RFQ.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button className="rounded-full bg-gray-900 px-3 py-1 font-medium text-white">
            All
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-1 font-medium text-gray-600">
            Express
          </button>
          <button className="rounded-full border border-gray-300 px-3 py-1 font-medium text-gray-600">
            Marketplace
          </button>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Categories
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {tops.map((c) => (
            <Link
              key={c.id}
              href={`/catalog/categories/${c.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-900 hover:shadow-sm"
            >
              <p className="text-sm font-medium text-gray-900">{c.name_en}</p>
              <p className="mt-1 text-[11px] text-gray-500">{c.name_ar}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Featured Products
          </h2>
          <Link
            href="/catalog/categories/office-supplies"
            className="text-xs text-gray-600 underline-offset-2 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allProducts.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Bundles
          </h2>
          <Link href="/catalog/bundles" className="text-xs text-gray-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.slice(0, 3).map((b) => (
            <Link
              key={b.id}
              href={`/catalog/bundles/${b.slug}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-900"
            >
              <p className="text-sm font-medium text-gray-900">{b.name_en}</p>
              <p className="mt-1 text-[11px] text-gray-500">{b.items.length} items</p>
              <p className="mt-2 text-xs text-gray-600">{b.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: { id: string; name_en: string; master_product_code: string; pack_types: string[] };
}) {
  return (
    <Link
      href={`/catalog/products/${product.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-900"
    >
      <div className="aspect-square w-full rounded bg-gray-100" />
      <p className="mt-3 text-sm font-medium text-gray-900">{product.name_en}</p>
      <p className="mt-1 text-[11px] text-gray-500 font-mono">
        {product.master_product_code}
      </p>
      <p className="mt-1 text-[11px] text-gray-500">
        {product.pack_types.join(" · ")}
      </p>
    </Link>
  );
}
