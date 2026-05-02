import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";
import { KYCActions } from "@/components/KYCActions";

export default async function Page() {
  const companies = await data.listKycQueue();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">KYC Verification Queue</h1>
        <p className="mt-1 text-sm text-gray-600">
          Companies awaiting verification of their CR/VAT documents.
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          Nothing in the KYC queue.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Company</th>
                <th className="p-3">Type</th>
                <th className="p-3">CR / VAT</th>
                <th className="p-3">Docs</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{c.real_name}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{c.platform_alias}</p>
                  </td>
                  <td className="p-3 text-gray-700">{c.type}</td>
                  <td className="p-3 text-xs text-gray-700">
                    {c.cr_number ? `CR ${c.cr_number}` : "—"}
                    {c.vat_number ? ` · VAT ${c.vat_number}` : ""}
                  </td>
                  <td className="p-3 text-gray-700">{c.kyc_docs.length}</td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3">
                    <KYCActions company_id={c.id} />
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
