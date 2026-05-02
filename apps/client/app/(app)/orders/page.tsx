// Orders list with two tabs: Orders (placed) | Waiting Approval.
// Anonymity: only supplier platform_alias shown.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveSupplierAlias } from "@/components/SupplierAlias";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === "approval" ? "approval" : "orders";

  const user = await getViewer();
  const all = await data.listPOsForUser({ user_id: user.id });

  const myApprovals = await data.listMyApprovalTasks(user.id);

  // Decorate orders with supplier alias.
  const decorated = await Promise.all(
    all.map(async (po) => ({
      ...po,
      supplier_alias: await resolveSupplierAlias(po.supplier_company_id),
    })),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 text-sm">
          <Link href="/orders?tab=orders" className={tabClass(tab === "orders")}>
            Orders
          </Link>
          <Link href="/orders?tab=approval" className={tabClass(tab === "approval")}>
            Waiting My Approval ({myApprovals.length})
          </Link>
        </nav>
      </div>

      {tab === "orders" ? (
        decorated.length === 0 ? (
          <Empty text="No orders yet. Award a quote to create your first PO." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total (SAR)</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {decorated.map((po) => (
                  <tr key={po.id}>
                    <td className="p-3 font-mono text-xs text-gray-900">{po.po_number}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-600">{po.items.length}</td>
                    <td className="p-3 text-gray-900">{po.total_sar.toFixed(2)}</td>
                    <td className="p-3 font-mono text-xs text-gray-700">
                      {po.supplier_alias}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/orders/${po.id}`}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : myApprovals.length === 0 ? (
        <Empty text="Nothing waiting on you right now." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Step</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myApprovals.map((task) => (
                <tr key={task.id}>
                  <td className="p-3 font-mono text-xs text-gray-900">
                    {task.po_id.slice(0, 8)}…
                  </td>
                  <td className="p-3 text-gray-700">Step {task.order_in_chain + 1}</td>
                  <td className="p-3">
                    <Link
                      href={`/orders/${task.po_id}`}
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      Review
                    </Link>
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

function tabClass(active: boolean): string {
  return `inline-block border-b-2 px-1 pb-2 ${
    active
      ? "border-gray-900 font-semibold text-gray-900"
      : "border-transparent text-gray-500 hover:text-gray-900"
  }`;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
      {text}
    </div>
  );
}
