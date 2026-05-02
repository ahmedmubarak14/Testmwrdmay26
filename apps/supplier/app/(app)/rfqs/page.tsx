// Received RFQs (supplier view).
// CLAUDE.md supplier blind:
//   - RFQs shown here are ONLY those this supplier was matched to.
//   - NO indicator of how many other suppliers got the same RFQ.
//   - Client identity NEVER shown beyond alias.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await getViewer();
  const companyId = user.company_id ?? "";

  const rfqs = await data.listOpenRFQsForSupplier(companyId);
  const myQuotes = await data.listQuotesForSupplier(companyId);
  const myQuoteByRFQ = new Map(myQuotes.map((q) => [q.rfq_id, q]));

  const decorated = rfqs.map((r) => {
    const quote = myQuoteByRFQ.get(r.id);
    const matchedItems = quote ? quote.items.length : 0;
    const matchType = !quote
      ? "Manual quote"
      : matchedItems === r.items.length
        ? "All items match your rate card"
        : `${matchedItems} of ${r.items.length} items match`;

    let autoStatus: string;
    if (!quote) {
      autoStatus = "—";
    } else if (quote.status === "draft_auto") {
      const sendsAt = quote.auto_send_at ? new Date(quote.auto_send_at) : null;
      autoStatus = sendsAt
        ? `Draft ready, auto-sends at ${sendsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "Draft ready";
    } else if (quote.status === "draft_manual") {
      autoStatus = "No auto-quote";
    } else if (quote.submitted_at) {
      autoStatus = `Sent at ${new Date(quote.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      autoStatus = quote.status.replace(/_/g, " ");
    }

    return { rfq: r, quote, matchType, autoStatus };
  });

  const filtered = decorated.filter((d) => {
    if (sp.filter === "auto-drafts") return d.quote?.status === "draft_auto";
    if (sp.filter === "manual") return d.quote?.status === "draft_manual" || !d.quote;
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">RFQ Requests</h1>
      <p className="text-sm text-gray-600">
        Quote requests matched to your rate card.
      </p>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/rfqs" className={pillClass(!sp.filter)}>
          All
        </Link>
        <Link href="/rfqs?filter=auto-drafts" className={pillClass(sp.filter === "auto-drafts")}>
          Auto-Drafts Pending
        </Link>
        <Link href="/rfqs?filter=manual" className={pillClass(sp.filter === "manual")}>
          Manual Quote Needed
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          Nothing in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">RFQ</th>
                <th className="p-3">Received</th>
                <th className="p-3">Items</th>
                <th className="p-3">Match Type</th>
                <th className="p-3">Auto-Draft Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(({ rfq, quote, matchType, autoStatus }) => (
                <tr key={rfq.id}>
                  <td className="p-3 font-mono text-xs text-gray-900">{rfq.rfq_number}</td>
                  <td className="p-3 text-gray-600">
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-gray-600">{rfq.items.length}</td>
                  <td className="p-3 text-xs text-gray-700">{matchType}</td>
                  <td className="p-3 text-xs text-gray-700">{autoStatus}</td>
                  <td className="p-3 text-xs">
                    {quote?.status === "draft_auto" ? (
                      <Link
                        href={`/rfqs/${rfq.id}/quote`}
                        className="rounded-md bg-blue-600 px-2 py-1 font-medium text-white hover:bg-blue-700"
                      >
                        Review &amp; Send
                      </Link>
                    ) : quote?.status === "draft_manual" || !quote ? (
                      <Link
                        href={`/rfqs/${rfq.id}/quote`}
                        className="rounded-md bg-gray-900 px-2 py-1 font-medium text-white hover:bg-gray-800"
                      >
                        Submit Quote
                      </Link>
                    ) : (
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-blue-700 underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
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

function pillClass(active: boolean): string {
  return `rounded-full border px-3 py-1 ${
    active
      ? "border-gray-900 bg-gray-900 text-white"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  }`;
}
