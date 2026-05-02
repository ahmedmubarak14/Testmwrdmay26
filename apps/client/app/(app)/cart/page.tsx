// RFQ basket. CLAUDE.md quote-only: NO PRICE COLUMN.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import {
  CartQtyStepper,
  RemoveCartItemButton,
  SaveCartButton,
} from "@/components/CartActions";

export default async function CartPage() {
  const user = await getViewer();
  const cart = await data.getActiveCart(user.id);

  const enriched = await Promise.all(
    cart.items.map(async (i) => {
      const mp = await data.getMasterProduct(i.master_product_id);
      return { item: i, product: mp };
    }),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Your RFQ Basket</h1>

      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-600">
            Your basket is empty. Browse the catalog or submit a custom request.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href="/catalog"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Browse Catalog
            </Link>
            <Link
              href="/rfqs/new/custom"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              Submit Custom Request
            </Link>
          </div>
        </div>
      ) : (
        <>
          <table className="w-full rounded-lg border border-gray-200 bg-white text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Pack type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enriched.map(({ item, product }) =>
                product ? (
                  <tr key={item.id}>
                    <td className="p-3">
                      <Link
                        href={`/catalog/products/${product.id}`}
                        className="block font-medium text-gray-900 hover:underline"
                      >
                        {product.name_en}
                      </Link>
                      <p className="text-[11px] font-mono text-gray-500">
                        {product.master_product_code}
                      </p>
                    </td>
                    <td className="p-3 text-gray-600">{item.pack_type}</td>
                    <td className="p-3">
                      <CartQtyStepper cart_item_id={item.id} initialQty={item.qty} />
                    </td>
                    <td className="p-3 text-right">
                      <RemoveCartItemButton cart_item_id={item.id} />
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/catalog"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Continue Browsing
            </Link>
            <SaveCartButton cart_id={cart.id} />
            <Link
              href="/rfqs/new"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Submit RFQ
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
