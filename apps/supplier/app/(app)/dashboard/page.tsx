// Supplier dashboard. Anonymity: client real_name NEVER shown.
// Supplier blind: NO indication of "competing suppliers" anywhere.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export default async function Page() {
  const user = await getViewer();
  const companyId = user.company_id ?? "";
  const firstName = user.real_name.split(" ")[0] ?? user.real_name;

  const offers = await data.listOffersForSupplier(companyId);
  const activeOffers = offers.filter((o) => o.status === "active" && o.approval_status === "approved");

  const quotes = await data.listQuotesForSupplier(companyId);
  const submittedQuotes = quotes.filter(
    (q) => q.status === "submitted_to_client" || q.status === "accepted" || q.status === "partially_accepted",
  );

  const openRFQs = await data.listOpenRFQsForSupplier(companyId);
  const matchCount = openRFQs.length;

  const pendingDrafts = quotes.filter(
    (q) => q.status === "draft_auto" || q.status === "draft_manual",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {firstName}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/rfqs"
          label="New RFQ Matches"
          value={matchCount}
          tone="warning"
        />
        <StatCard href="/quotes" label="Quotes Submitted" value={submittedQuotes.length} />
        <StatCard href="/rate-card" label="Active Offers" value={activeOffers.length} />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Pending Actions</h2>
        {pendingDrafts.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-500">
            No drafts waiting on you.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="pb-2">RFQ</th>
                <th className="pb-2">Auto-Quote Status</th>
                <th className="pb-2">Items</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingDrafts.map((q) => {
                const sendsAt = q.auto_send_at ? new Date(q.auto_send_at) : null;
                const status =
                  q.status === "draft_auto"
                    ? `Auto-draft pending review${sendsAt ? ` until ${sendsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`
                    : "Manual quote needed";
                return (
                  <tr key={q.id}>
                    <td className="py-2 font-mono text-xs text-gray-900">
                      {q.quote_number}
                    </td>
                    <td className="py-2 text-gray-600">{status}</td>
                    <td className="py-2 text-gray-600">{q.items.length}</td>
                    <td className="py-2">
                      <Link
                        href={`/rfqs/${q.rfq_id}/quote`}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {q.status === "draft_auto" ? "Review & Send" : "Submit Quote"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({
  href,
  label,
  value,
  tone = "default",
}: {
  href: string;
  label: string;
  value: number;
  tone?: "warning" | "default";
}) {
  const styles =
    tone === "warning"
      ? "bg-orange-500 text-white"
      : "bg-gray-900 text-white";
  return (
    <Link href={href} className={`block rounded-lg p-4 ${styles}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Link>
  );
}
