// Company catalogs — saved lists of master products. NO PRICES.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export default async function Page() {
  const user = await getViewer();
  const catalogs = await data.listCompanyCatalogs(user.company_id ?? "");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Company Catalogs</h1>
        <Link
          href="/catalogs/new"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Create Catalog
        </Link>
      </div>

      {catalogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No catalogs yet. Create one to group products you order regularly.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalogs.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              <p className="mt-1 text-xs text-gray-500">{c.description}</p>
              <p className="mt-2 text-[11px] text-gray-500">
                {c.master_product_ids.length} items
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
