// Bundles list. NO "From SAR X" — quote-only rule applies.

import Link from "next/link";

import { data } from "@mwrd/shared";

export default async function Page() {
  const bundles = await data.listBundles();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Bundles</h1>
      <p className="text-sm text-gray-600">
        Pre-built kits. Add a bundle to your basket and submit an RFQ to get quotes.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.map((b) => (
          <Link
            key={b.id}
            href={`/catalog/bundles/${b.slug}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-900"
          >
            <div className="aspect-video w-full rounded bg-gray-100" />
            <p className="mt-3 text-sm font-medium text-gray-900">{b.name_en}</p>
            <p className="mt-1 text-[11px] text-gray-500">{b.items.length} items</p>
            <p className="mt-2 text-xs text-gray-600">{b.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
