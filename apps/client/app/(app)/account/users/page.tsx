// Account → Users tab. Top-level account-management page.

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { AccountTabs } from "@/components/AccountTabs";

export default async function Page() {
  const user = await getViewer();
  const members = await data.listCompanyMembers(user.company_id ?? "");

  return (
    <div className="space-y-4">
      <AccountTabs current="users" />

      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Account Management</h1>
        <button
          type="button"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Invite User
        </button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          You&apos;re the only user on this account. Invite teammates to delegate
          ordering and approvals.
        </div>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">User ID</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="p-3 font-mono text-xs text-gray-900">{m.user_id}</td>
                <td className="p-3 text-gray-600">{m.company_role_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
