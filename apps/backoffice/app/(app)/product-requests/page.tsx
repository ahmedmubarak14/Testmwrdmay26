import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";
import { PARActions } from "@/components/PARActions";

export default async function Page() {
  const requests = await data.listAllProductAdditionRequests();
  const allUsers = await data.listAllUsers();
  const allCompanies = await data.listSupplierCompanies();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Product Addition Requests</h1>
        <p className="mt-1 text-sm text-gray-600">
          Supplier proposals for new master products.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No product addition requests pending.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Submitted</th>
                <th className="p-3">Proposed name</th>
                <th className="p-3">Submitted by</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((r) => {
                const user = allUsers.find((u) => u.id === r.requested_by_user_id);
                const company = allCompanies.find((c) => c.id === r.supplier_company_id);
                return (
                  <tr key={r.id} className="align-top">
                    <td className="p-3 text-gray-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{r.proposed_name_en}</p>
                      <p className="text-[11px] text-gray-500">{r.proposed_name_ar}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-gray-700">{user?.real_name ?? "—"}</p>
                      <p className="text-[11px] text-gray-500">{company?.real_name ?? "—"}</p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3">
                      {r.status === "submitted" || r.status === "under_review" ? (
                        <PARActions
                          par_id={r.id}
                          proposed={{
                            name_en: r.proposed_name_en,
                            name_ar: r.proposed_name_ar,
                            description: r.proposed_description,
                            category_id: r.proposed_category_id,
                            specs: r.proposed_specs,
                          }}
                        />
                      ) : r.status === "rejected" ? (
                        <p className="max-w-xs text-[11px] text-gray-600">
                          {r.rejection_reason ?? "No reason on file"}
                        </p>
                      ) : (
                        <span className="text-[11px] text-gray-500">
                          MP {r.resulting_master_product_id?.slice(0, 8) ?? ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
