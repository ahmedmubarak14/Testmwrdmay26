// Orders Management (supplier view).
// CLAUDE.md anonymity: client real_name NEVER shown — alias only.

import Link from "next/link";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === "completed" ? "completed" : sp.tab === "pending" ? "pending" : "won";

  const user = await getViewer();
  const all = await data.listPOsForUser({ user_id: user.id });
  // Resolve client aliases via getCompany (alias-only, never real_name).
  const decorated = await Promise.all(
    all.map(async (po) => {
      const company = await data.getCompany(po.client_company_id);
      return { po, client_alias: company?.platform_alias ?? "Client" };
    }),
  );

  const filtered = decorated.filter(({ po }) => {
    if (tab === "completed") return po.status === "completed" || po.status === "delivered";
    if (tab === "pending") return po.status === "draft" || po.status === "awaiting_approval";
    return po.status === "confirmed" || po.status === "in_transit";
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Orders Management</h1>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 text-sm">
          {[
            { key: "won", label: "Won Purchase Orders" },
            { key: "completed", label: "Completed Orders" },
            { key: "pending", label: "Pending Orders" },
          ].map((t) => (
            <Link
              key={t.key}
              href={`/orders?tab=${t.key}`}
              className={`inline-block border-b-2 px-1 pb-2 ${
                tab === t.key
                  ? "border-gray-900 font-semibold text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="text-[11px] text-gray-500">
        Client names are anonymized for privacy.
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          Nothing in this tab yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Client</th>
                <th className="p-3">Items</th>
                <th className="p-3">Acceptance</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(({ po, client_alias }) => (
                <tr key={po.id}>
                  <td className="p-3 font-mono text-xs text-gray-900">{po.po_number}</td>
                  <td className="p-3 font-mono text-xs text-gray-700">{client_alias}</td>
                  <td className="p-3 text-gray-600">{po.items.length}</td>
                  <td className="p-3 text-gray-600">
                    {new Date(po.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/orders/${po.id}`}
                      className="text-xs text-blue-700 underline-offset-2 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-[11px] text-gray-500">
            Showing 1–{filtered.length} of {filtered.length}
          </p>
        </div>
      )}
    </div>
  );
}
