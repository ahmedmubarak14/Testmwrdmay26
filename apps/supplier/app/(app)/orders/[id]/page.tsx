// SPO detail (supplier view).
// CLAUDE.md anonymity: client by alias only; no full address that exposes client identity.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const po = await data.getPO(id);
  if (!po) notFound();
  const company = await data.getCompany(po.client_company_id);
  const rfq = po.rfq_id ? await data.getRFQ(po.rfq_id) : null;

  return (
    <div className="space-y-4">
      <Link href="/orders" className="text-xs text-gray-500 hover:underline">
        ← All orders
      </Link>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs text-gray-500">{po.po_number}</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {po.type === "SPO" ? "Supplier Purchase Order" : "Client Purchase Order"}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <StatusBadge status={po.status} />
            <span>·</span>
            <span>
              Client <span className="font-mono">{company?.platform_alias ?? "Client"}</span>
            </span>
            <span>·</span>
            <span>Ref {po.transaction_ref}</span>
            {rfq ? (
              <>
                <span>·</span>
                <span>Delivery to {rfq.delivery_city}</span>
              </>
            ) : null}
          </div>
        </div>
        {po.status === "confirmed" ? (
          <Link
            href={`/orders/${po.id}/dn`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Delivery Note
          </Link>
        ) : null}
      </div>

      <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="p-3">Item</th>
            <th className="p-3">Qty</th>
            <th className="p-3">Pack</th>
            <th className="p-3">Your unit cost (SAR)</th>
            <th className="p-3">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {po.items.map((it) => (
            <tr key={it.id}>
              <td className="p-3">{it.description || it.free_text_name || "—"}</td>
              <td className="p-3 text-gray-600">{it.qty}</td>
              <td className="p-3 text-gray-600">{it.pack_type}</td>
              <td className="p-3 text-gray-900">{it.unit_price_sar.toFixed(2)}</td>
              <td className="p-3 text-gray-900">
                {(it.unit_price_sar * it.qty).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
