// Saved RFQ baskets. NO PRICES.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { ResumeCartButton } from "@/components/ResumeCartButton";

export default async function SavedCartsPage() {
  const user = await getViewer();
  const carts = await data.listSavedCarts(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Saved RFQ Baskets</h1>

      {carts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-600">
            No saved baskets. Create one from your active basket.
          </p>
          <p className="mt-2 text-[11px] text-gray-500">
            Baskets expire 7 working days from creation.
          </p>
          <Link
            href="/cart"
            className="mt-4 inline-block rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Go to active basket
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {carts.map((c) => {
            const expiresAt = c.expires_at ? new Date(c.expires_at) : null;
            const daysLeft = expiresAt
              ? Math.max(
                  0,
                  Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000)),
                )
              : null;
            return (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {c.name ?? "Untitled basket"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {c.items.length} items · Expires in {daysLeft ?? "—"} days
                </p>
                <div className="mt-3">
                  <ResumeCartButton cart_id={c.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
