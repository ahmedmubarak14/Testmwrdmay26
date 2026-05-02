// RFQ list. Status filters via ?status=. Anonymity-safe (only RFQ data).

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await getViewer();
  const all = await data.listRFQsForClient(user.company_id ?? "");
  const filtered = sp.status
    ? all.filter((r) => r.status === sp.status)
    : all;

  // Pre-compute quotes per RFQ for the action column.
  const quoteCounts = await Promise.all(
    filtered.map((r) => data.listQuotesForRFQ(r.id).then((qs) => qs.length)),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Request History</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track the status of your RFQs and review incoming quotes.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/rfqs/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New RFQ from Basket
          </Link>
          <Link
            href="/rfqs/new/custom"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            + Custom Request
          </Link>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/rfqs"
          className={pillClass(!sp.status)}
        >
          All
        </Link>
        {(["open", "quoted", "awarded", "partially_awarded", "cancelled"] as const).map(
          (s) => (
            <Link key={s} href={`/rfqs?status=${s}`} className={pillClass(sp.status === s)}>
              {s.replace(/_/g, " ")}
            </Link>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-600">No RFQs in this view.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">RFQ</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((r, idx) => {
                const qcount = quoteCounts[idx] ?? 0;
                return (
                  <tr key={r.id}>
                    <td className="p-3">
                      <Link
                        href={`/rfqs/${r.id}`}
                        className="block font-mono text-xs text-gray-900 hover:underline"
                      >
                        {r.rfq_number}
                      </Link>
                      <p className="text-[11px] text-gray-500">{r.title}</p>
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-600">{r.items.length}</td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3">
                      {r.status === "quoted" || r.status === "open" ? (
                        <Link
                          href={`/rfqs/${r.id}`}
                          className="text-xs font-medium text-blue-700 hover:underline"
                        >
                          {qcount > 0
                            ? `Review Quotes (${qcount})`
                            : "Awaiting Suppliers"}
                        </Link>
                      ) : r.status === "awarded" || r.status === "partially_awarded" ? (
                        <Link
                          href={`/rfqs/${r.id}`}
                          className="text-xs font-medium text-green-700 hover:underline"
                        >
                          View Award
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function pillClass(active: boolean): string {
  return `rounded-full border px-3 py-1 ${
    active
      ? "border-gray-900 bg-gray-900 text-white"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  }`;
}
