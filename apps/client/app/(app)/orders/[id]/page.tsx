// PO detail. Anonymity: supplier shown by alias only.
// Shows approval chain status; Approve/Reject buttons if current user is approver.

import Link from "next/link";
import { notFound } from "next/navigation";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";
import { resolveSupplierAlias } from "@/components/SupplierAlias";
import { ApprovalActions } from "@/components/ApprovalActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const po = await data.getPO(id);
  if (!po) notFound();

  const user = await getViewer();
  const supplierAlias = await resolveSupplierAlias(po.supplier_company_id);
  const approvalTasks = await data.getApprovalChainStatus(po.id);
  const myPendingTask = approvalTasks.find(
    (t) => t.approver_user_id === user.id && t.status === "pending",
  );

  return (
    <div className="space-y-4">
      <Link href="/orders" className="text-xs text-gray-500 hover:underline">
        ← All orders
      </Link>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xs text-gray-500">{po.po_number}</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {po.type === "CPO" ? "Client Purchase Order" : "Supplier Purchase Order"}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <StatusBadge status={po.status} />
            <span>·</span>
            <span>Supplier <span className="font-mono">{supplierAlias}</span></span>
            <span>·</span>
            <span>Ref {po.transaction_ref}</span>
          </div>
        </div>
        {myPendingTask ? <ApprovalActions task_id={myPendingTask.id} /> : null}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Items
        </h2>
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Pack</th>
              <th className="p-3">Unit price (SAR)</th>
              <th className="p-3">Subtotal (SAR)</th>
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
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider text-gray-500">
                Total
              </td>
              <td className="p-3 font-semibold text-gray-900">{po.total_sar.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Approval chain
        </h2>
        {approvalTasks.length === 0 ? (
          <p className="text-sm text-gray-500">
            No approval chain configured — order auto-confirmed.
          </p>
        ) : (
          <ol className="space-y-1 text-sm">
            {approvalTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2"
              >
                <span>
                  Step {t.order_in_chain + 1} — approver{" "}
                  <span className="font-mono">{t.approver_user_id.slice(0, 8)}…</span>
                </span>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
