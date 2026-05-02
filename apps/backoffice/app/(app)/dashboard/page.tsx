// Backoffice dashboard. Backoffice sees real_name on both sides.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";

export default async function Page() {
  const [allUsers, allCompanies, allOffers, allRFQs, allQuotes, allOrders, leads, kyc, prod, offerQ] =
    await Promise.all([
      data.listAllUsers(),
      data.listClientCompanies().then(async (clients) => {
        const suppliers = await data.listSupplierCompanies();
        return { clients, suppliers };
      }),
      Array.from(await fakeOffers()),
      data.listRFQsForClient("").then(() => listAllRFQs()),
      Array.from(await fakeQuotes()),
      listAllPOs(),
      data.listLeadsQueue(),
      data.listKycQueue(),
      data.listAllProductAdditionRequests(),
      data.listOfferApprovalQueue(),
    ]);

  const totalSales = allOrders.reduce(
    (s, p) => (p.type === "CPO" && p.status === "completed" ? s + p.total_sar : s),
    0,
  );
  const ordersCount = allOrders.filter((p) => p.type === "CPO").length;

  // Average margin proxy: ratio of (final - cost) / final across CPOs.
  // Phase 2 will compute this from server-side margin records.
  const avgMargin =
    allOrders.length > 0
      ? (allOrders.reduce((s, p) => {
          const itemsCost = p.items.reduce(
            (acc, it) => acc + (it.supplier_unit_cost_sar ?? 0) * it.qty,
            0,
          );
          const total = p.total_sar || 1;
          return s + (total - itemsCost) / total;
        }, 0) /
          Math.max(1, allOrders.length)) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of platform performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI label="Total Sales (completed)" value={`SAR ${formatThousands(totalSales)}`} delta="+12% vs last month" />
        <KPI label="Average Margin" value={`${avgMargin.toFixed(1)}%`} delta="+0.5% vs last month" />
        <KPI label="Total Orders" value={String(ordersCount)} delta="+8% vs last month" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Revenue Breakdown</h2>
          <p className="mt-2 text-xs text-gray-500">
            Phase 2 wires real charts. For now: {ordersCount} orders, SAR{" "}
            {formatThousands(totalSales)} closed; {allRFQs.length} RFQs lifetime;{" "}
            {allQuotes.length} quotes generated.
          </p>
          <ul className="mt-4 space-y-1 text-xs text-gray-700">
            <li>• Clients: {allCompanies.clients.length}</li>
            <li>• Suppliers: {allCompanies.suppliers.length}</li>
            <li>• Active offers: {allOffers.filter((o) => o.status === "active").length}</li>
            <li>• Users on platform: {allUsers.length}</li>
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Pending Actions</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <ActionRow href="/leads" label="Leads in callback queue" count={leads.length} />
            <ActionRow href="/kyc" label="KYC reviews" count={kyc.length} />
            <ActionRow
              href="/product-requests"
              label="Product addition requests"
              count={prod.filter((p) => p.status === "submitted" || p.status === "under_review").length}
            />
            <ActionRow href="/offer-approvals" label="Offer approvals" count={offerQ.length} />
            <ActionRow
              href="/quote-manager"
              label="Quotes pending admin review"
              count={allQuotes.filter((q) => q.status === "pending_admin_review").length}
            />
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Orders</h2>
        {allOrders.length === 0 ? (
          <p className="text-xs text-gray-500">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="pb-2">PO</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Total (SAR)</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allOrders.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td className="py-2 font-mono text-xs text-gray-900">{p.po_number}</td>
                  <td className="py-2 text-gray-600">{p.type}</td>
                  <td className="py-2 text-gray-600">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-gray-900">{p.total_sar.toFixed(2)}</td>
                  <td className="py-2">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatThousands(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

async function fakeOffers() {
  // We don't have a global "list all offers" reader on the public API.
  // Aggregate per supplier for stats. Phase 2 will add data.listAllOffers().
  const suppliers = await data.listSupplierCompanies();
  const all: import("@mwrd/shared").Offer[] = [];
  for (const s of suppliers) {
    const list = await data.listOffersForSupplier(s.id);
    all.push(...list);
  }
  return all;
}

async function listAllRFQs(): Promise<import("@mwrd/shared").RFQ[]> {
  // Aggregate per client company. Phase 2 will add a listAllRFQs reader.
  const clients = await data.listClientCompanies();
  const all: import("@mwrd/shared").RFQ[] = [];
  for (const c of clients) {
    const list = await data.listRFQsForClient(c.id);
    all.push(...list);
  }
  return all;
}

async function fakeQuotes(): Promise<import("@mwrd/shared").Quote[]> {
  const suppliers = await data.listSupplierCompanies();
  const all: import("@mwrd/shared").Quote[] = [];
  for (const s of suppliers) {
    const list = await data.listQuotesForSupplier(s.id);
    all.push(...list);
  }
  return all;
}

async function listAllPOs(): Promise<import("@mwrd/shared").PO[]> {
  const allUsers = await data.listAllUsers();
  // Use admin user's listPOsForUser path which returns everything.
  const admin = allUsers.find((u) => u.role === "admin");
  if (!admin) return [];
  return data.listPOsForUser({ user_id: admin.id });
}

function KPI({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-[11px] text-emerald-700">{delta}</p>
    </div>
  );
}

function ActionRow({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50"
      >
        <span className="text-gray-700">{label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            count > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      </Link>
    </li>
  );
}
