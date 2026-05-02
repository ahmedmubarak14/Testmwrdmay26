// Leads / Callback Queue. Backoffice sees real_name on both sides.

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";
import { MarkCallbackButton } from "@/components/MarkCallbackButton";

export default async function Page() {
  const leads = await data.listLeadsQueue();
  const decorated = await Promise.all(
    leads.map(async (u) => ({
      user: u,
      company: u.company_id ? await data.getCompany(u.company_id) : null,
    })),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Lead Management — Callback Queue</h1>
        <p className="mt-1 text-sm text-gray-600">
          Newly registered users awaiting verification call. Status flips to KYC after callback completes.
        </p>
      </div>

      {decorated.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No leads in the callback queue.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Submitted</th>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Type</th>
                <th className="p-3">Company</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {decorated.map(({ user, company }) => (
                <tr key={user.id}>
                  <td className="p-3 text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{user.real_name}</p>
                    <p className="text-[11px] text-gray-500">{user.email}</p>
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-700">{user.phone}</td>
                  <td className="p-3 text-gray-700">{user.role}</td>
                  <td className="p-3 text-gray-700">{company?.real_name ?? "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="p-3">
                    <MarkCallbackButton user_id={user.id} />
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
