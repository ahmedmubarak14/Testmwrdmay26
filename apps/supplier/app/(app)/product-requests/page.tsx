// Product Addition Requests list. Supplier-private (own requests only).

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";

export default async function Page() {
  const user = await getViewer();
  const requests = await data.listMyProductAdditionRequests(user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Product Addition Requests
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Request additions to the master catalog.
          </p>
        </div>
        <Link
          href="/product-requests/new"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Submit New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No requests yet. If a product you want to sell isn&apos;t in the catalog,
          submit it for review.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Proposed Name</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{r.proposed_name_en}</p>
                    <p className="text-[11px] text-gray-500">{r.proposed_name_ar}</p>
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-xs">
                    {r.status === "approved" && r.resulting_master_product_id ? (
                      <Link
                        className="text-blue-700 hover:underline"
                        href={`/catalog/products/${r.resulting_master_product_id}`}
                      >
                        Now available — Create Offer
                      </Link>
                    ) : r.status === "rejected" ? (
                      <details className="inline-block">
                        <summary className="cursor-pointer text-gray-700 underline-offset-2 hover:underline">
                          View reason
                        </summary>
                        <p className="mt-1 max-w-xs text-[11px] text-gray-600">
                          {r.rejection_reason ?? "No reason provided."}
                        </p>
                      </details>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
