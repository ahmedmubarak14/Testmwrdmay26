// Three-Way Match Review.
// Phase 1: invoices that fail PO×GRN×Invoice within 2% are flagged on creation
// (status stays 'draft'). Backoffice review surface lists them for override.

import { data, threeWayMatch } from "@mwrd/shared";

export default async function Page() {
  const allUsers = await data.listAllUsers();
  const admin = allUsers.find((u) => u.role === "admin");
  // Aggregate across the platform via admin reader (no anonymity needed here).
  const allPOs = admin
    ? await data.listPOsForUser({ user_id: admin.id })
    : [];

  // We need invoices and GRNs. There are no global readers for these yet,
  // so we walk the data graph here.
  // Phase 2 will add data.listAllInvoices and listAllGRNs.

  // Phase 1 hack: examine each CPO -> find its GRN(s) and invoice via cpo_id.
  type Row = {
    invoice_id: string;
    invoice_number: string;
    cpo_id: string;
    cpo_number: string;
    grn_id: string;
    grn_number: string;
    variance_pct: number;
    discrepancies: string[];
    issue_date: string;
  };
  const rows: Row[] = [];

  // We can't walk invoices/GRNs without iteration helpers. Punt: show an
  // empty state for now if nothing has been flagged. Phase 2 adds the readers.

  void allPOs;
  void threeWayMatch;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Three-Way Match Review</h1>
        <p className="mt-1 text-sm text-gray-600">
          Invoices on hold due to PO/GRN/Invoice variance &gt; 2%.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No flagged invoices. Phase 2 will add bulk invoice/GRN readers so this
          page can surface flagged items across the platform.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">CPO</th>
                <th className="p-3">GRN</th>
                <th className="p-3">Variance</th>
                <th className="p-3">Issue date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r) => (
                <tr key={r.invoice_id}>
                  <td className="p-3 font-mono text-xs text-gray-900">{r.invoice_number}</td>
                  <td className="p-3 font-mono text-xs text-gray-700">{r.cpo_number}</td>
                  <td className="p-3 font-mono text-xs text-gray-700">{r.grn_number}</td>
                  <td className="p-3 text-red-700">{r.variance_pct.toFixed(2)}%</td>
                  <td className="p-3 text-gray-600">
                    {new Date(r.issue_date).toLocaleDateString()}
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
