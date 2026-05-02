import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";

export default async function Page() {
  const companies = await data.listClientCompanies();
  const allUsers = await data.listAllUsers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Client Management</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Alias</th>
              <th className="p-3">Primary contact</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((c) => {
              const owner = allUsers.find((u) => u.company_id === c.id);
              return (
                <tr key={c.id}>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{c.real_name}</p>
                    <p className="text-[11px] text-gray-500">
                      CR {c.cr_number ?? "—"} · VAT {c.vat_number ?? "—"}
                    </p>
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-700">{c.platform_alias}</td>
                  <td className="p-3">
                    <p className="text-gray-700">{owner?.real_name ?? "—"}</p>
                    <p className="text-[11px] text-gray-500">{owner?.email ?? "—"}</p>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
