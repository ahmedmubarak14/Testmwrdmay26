// Category browse. NO PRICES. Filters: subcategory, search, pagination.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string; q?: string; page?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const categories = await data.listCategories();
  const top = categories.find((c) => c.slug === slug && c.parent_id === null);
  if (!top) notFound();
  const subs = categories.filter((c) => c.parent_id === top.id);

  const effectiveCategoryId = sp.sub ?? top.id;
  const page = Number(sp.page ?? 1);
  const products = await data.listMasterProducts({
    category_id: effectiveCategoryId,
    search: sp.q,
    page,
    page_size: 25,
  });

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500">
        <Link href="/catalog" className="hover:underline">
          Catalog
        </Link>{" "}
        / <span className="text-gray-900">{top.name_en}</span>
      </nav>

      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{top.name_en}</h1>
        <form className="flex items-center gap-2" action="" method="get">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search this category"
            className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input type="hidden" name="sub" value={sp.sub ?? ""} />
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px,1fr]">
        <aside className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Subcategory
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={`/catalog/categories/${slug}`}
                  className={`block rounded px-2 py-1 ${
                    !sp.sub ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All
                </Link>
              </li>
              {subs.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/catalog/categories/${slug}?sub=${s.id}`}
                    className={`block rounded px-2 py-1 ${
                      sp.sub === s.id
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {s.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pack types
            </p>
            <p className="text-xs text-gray-500">Filtering by pack ships in v2.</p>
          </div>
        </aside>

        <div>
          <p className="mb-3 text-xs text-gray-500">
            {products.total} products · page {products.page} of{" "}
            {Math.max(1, Math.ceil(products.total / products.page_size))}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.items.map((p) => (
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
                <p className="mt-1 text-[11px] text-gray-500">{p.pack_types.join(" · ")}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
