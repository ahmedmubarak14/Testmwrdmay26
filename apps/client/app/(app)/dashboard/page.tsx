import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const user = await getViewer();
  const companyId = user.company_id ?? "";
  const firstName = user.real_name.split(" ")[0] ?? user.real_name;

  const rfqs = await data.listRFQsForClient(companyId);
  const recentRFQs = rfqs
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 3);
  const pendingQuotedCount = rfqs.filter((r) => r.status === "quoted").length;

  // Pull all client-visible quotes across recent RFQs (anonymity-safe: we
  // never display supplier real_name, only platform_alias).
  const allQuotesByRfq = await Promise.all(
    rfqs.slice(0, 5).map((r) => data.listQuotesForRFQ(r.id)),
  );
  const allQuotes = allQuotesByRfq.flat().slice(0, 4);

  // Orders for table.
  const orders = await data.listPOsForUser({ user_id: user.id });
  const recentOrders = orders
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {firstName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ActionCard
          href="/rfqs/new"
          title="Create New RFQ"
          subtitle="Build an RFQ from your basket"
          tone="primary"
        />
        <ActionCard
          href="/rfqs?status=quoted"
          title="View Pending Quotes"
          subtitle={`${pendingQuotedCount} RFQ${pendingQuotedCount === 1 ? "" : "s"} with new quotes`}
        />
        <ActionCard
          href="/orders"
          title="Track Orders"
          subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Recent RFQs" href="/rfqs">
          {recentRFQs.length === 0 ? (
            <Empty text="No RFQs yet. Browse the catalog to start one." />
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentRFQs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/rfqs/${r.id}`} className="font-medium text-gray-900 hover:underline">
                    {r.rfq_number}
                  </Link>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Quotes Received" href="/rfqs?status=quoted">
          {allQuotes.length === 0 ? (
            <Empty text="Suppliers haven't responded yet." />
          ) : (
            <ul className="divide-y divide-gray-200">
              {allQuotes.map((q) => {
                const rfq = rfqs.find((r) => r.id === q.rfq_id);
                const supplier = q.supplier_company_id
                  ? null // Look up the supplier's platform_alias only — never real_name.
                  : null;
                const total = q.items.reduce(
                  (s, i) => s + i.final_unit_price_sar * i.qty_available,
                  0,
                );
                return (
                  <li key={q.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">
                        For {rfq?.rfq_number ?? "RFQ"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        From <SupplierAliasInline companyId={q.supplier_company_id} />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        SAR {total.toFixed(2)}
                      </p>
                      <Link
                        href={`/rfqs/${q.rfq_id}`}
                        className="text-[11px] text-gray-700 underline-offset-2 hover:underline"
                      >
                        View Quote
                      </Link>
                    </div>
                    {supplier ? null : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Order History" href="/orders">
        {recentOrders.length === 0 ? (
          <Empty text="No orders yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="pb-2">PO</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Items</th>
                <th className="pb-2">Total (SAR)</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((po) => (
                <tr key={po.id}>
                  <td className="py-2 font-mono text-xs text-gray-900">{po.po_number}</td>
                  <td className="py-2 text-gray-600">
                    {new Date(po.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-gray-600">{po.items.length}</td>
                  <td className="py-2 text-gray-900">{po.total_sar.toFixed(2)}</td>
                  <td className="py-2">
                    <StatusBadge status={po.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

// Server-component that resolves a supplier's platform_alias (NEVER real_name).
async function SupplierAliasInline({ companyId }: { companyId: string }) {
  const all = await data.listAllUsers();
  // Backstop — usually we'd add a getCompany() helper. For now we look it up
  // via any user belonging to that supplier company, then strip to alias.
  const user = all.find((u) => u.company_id === companyId);
  return <span className="font-mono">{user?.platform_alias ?? "Supplier"}</span>;
}

function ActionCard({
  href,
  title,
  subtitle,
  tone = "default",
}: {
  href: string;
  title: string;
  subtitle: string;
  tone?: "primary" | "default";
}) {
  const styles =
    tone === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200";
  return (
    <Link href={href} className={`block rounded-lg p-4 shadow-sm ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p
        className={`mt-1 text-xs ${
          tone === "primary" ? "text-blue-100" : "text-gray-500"
        }`}
      >
        {subtitle}
      </p>
    </Link>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {href ? (
          <Link href={href} className="text-xs text-gray-500 underline-offset-2 hover:underline">
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-gray-500">{text}</p>;
}

