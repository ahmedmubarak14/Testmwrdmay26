// My Quotes. CLAUDE.md supplier blind:
//   On rejection, supplier sees only "Quote not accepted" — NO reason,
//   NO comparison, NO winner identity.

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
  const all = await data.listQuotesForSupplier(user.company_id ?? "");
  const filtered = sp.status ? all.filter((q) => q.status === sp.status) : all;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">My Quotes</h1>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/quotes" className={pillClass(!sp.status)}>
          All
        </Link>
        {(
          [
            "draft_auto",
            "draft_manual",
            "pending_admin_review",
            "submitted_to_client",
            "accepted",
            "partially_accepted",
            "rejected",
            "expired",
          ] as const
        ).map((s) => (
          <Link key={s} href={`/quotes?status=${s}`} className={pillClass(sp.status === s)}>
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No quotes in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Quote</th>
                <th className="p-3">RFQ</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Total (SAR)</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((q) => {
                const total = q.items.reduce(
                  (s, i) => s + i.supplier_unit_price_sar * i.qty_available,
                  0,
                );
                return (
                  <tr key={q.id}>
                    <td className="p-3 font-mono text-xs text-gray-900">{q.quote_number}</td>
                    <td className="p-3 font-mono text-xs text-gray-700">
                      {q.rfq_id.slice(0, 8)}…
                    </td>
                    <td className="p-3 text-gray-600">
                      {q.submitted_at
                        ? new Date(q.submitted_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3 text-gray-900">{total.toFixed(2)}</td>
                    <td className="p-3">
                      {q.status === "rejected" ? (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-700">
                          Quote not accepted
                        </span>
                      ) : (
                        <StatusBadge status={q.status} />
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="text-xs text-blue-700 underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
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
