// Bundle detail. NO PRICES.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { AddBundleButton } from "@/components/AddBundleButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const all = await data.listBundles();
  const bundle = all.find((b) => b.slug === slug);
  if (!bundle) notFound();

  const items = await Promise.all(
    bundle.items.map(async (bi) => {
      const mp = await data.getMasterProduct(bi.master_product_id);
      return { bi, mp };
    }),
  );

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/catalog" className="hover:underline">
          Catalog
        </Link>{" "}
        /{" "}
        <Link href="/catalog/bundles" className="hover:underline">
          Bundles
        </Link>{" "}
        / <span className="text-gray-900">{bundle.name_en}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <div className="aspect-video w-full rounded-lg bg-gray-100" />
        <div className="rounded-lg bg-teal-900 p-6 text-white">
          <h1 className="text-2xl font-semibold">{bundle.name_en}</h1>
          <p className="mt-1 text-sm text-teal-100">{bundle.name_ar}</p>
          <p className="mt-3 text-sm text-teal-50">{bundle.description}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-teal-200">
            {bundle.items.length} items in this bundle
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Items in this bundle
        </h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="pb-2">Product</th>
              <th className="pb-2">Pack type</th>
              <th className="pb-2">Default qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(({ bi, mp }) =>
              mp ? (
                <tr key={bi.id}>
                  <td className="py-2">
                    <Link
                      href={`/catalog/products/${mp.id}`}
                      className="block font-medium text-gray-900 hover:underline"
                    >
                      {mp.name_en}
                    </Link>
                    <p className="text-[11px] font-mono text-gray-500">
                      {mp.master_product_code}
                    </p>
                  </td>
                  <td className="py-2 text-gray-600">
                    {mp.pack_types[0] ?? "Each"}
                  </td>
                  <td className="py-2 text-gray-900">{bi.qty}</td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      </section>

      <AddBundleButton bundle_id={bundle.id} />
    </div>
  );
}
