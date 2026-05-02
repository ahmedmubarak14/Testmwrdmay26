// Catalog RFQ submission. Lists basket contents, captures meta, submits.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { SubmitRFQForm } from "@/components/SubmitRFQForm";

export default async function Page() {
  const user = await getViewer();
  const cart = await data.getActiveCart(user.id);
  const enriched = await Promise.all(
    cart.items.map(async (i) => ({ item: i, product: await data.getMasterProduct(i.master_product_id) })),
  );
  const defaultDate = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Submit RFQ</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review your basket, add some context, and we&apos;ll route it to verified suppliers.
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-600">
            Your basket is empty. <Link href="/catalog" className="font-medium text-gray-900 underline">Browse catalog</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Items in this RFQ
            </h2>
            <ul className="divide-y divide-gray-200 text-sm">
              {enriched.map(({ item, product }) =>
                product ? (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{product.name_en}</p>
                      <p className="text-[11px] font-mono text-gray-500">
                        {product.master_product_code}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600">
                      {item.qty} × {item.pack_type}
                    </p>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <SubmitRFQForm defaultDate={defaultDate} />
          </section>
        </div>
      )}
    </div>
  );
}
