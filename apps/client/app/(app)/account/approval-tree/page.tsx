// Approval tree. CLAUDE.md: setDirectApprover MUST reject cycles.

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { AccountTabs } from "@/components/AccountTabs";

export default async function Page() {
  const user = await getViewer();
  const members = await data.listCompanyMembers(user.company_id ?? "");
  const nodes = await data.listApprovalNodes(user.company_id ?? "");

  return (
    <div className="space-y-4">
      <AccountTabs current="approval" />
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Approval Tree</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure who approves whose orders. Cycles are rejected automatically.
        </p>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          Invite teammates first, then configure their approvers here.
        </div>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Member</th>
              <th className="p-3">Direct Approver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((m) => {
              const node = nodes.find((n) => n.member_user_id === m.user_id);
              return (
                <tr key={m.id}>
                  <td className="p-3 font-mono text-xs text-gray-900">{m.user_id}</td>
                  <td className="p-3 font-mono text-xs text-gray-700">
                    {node?.direct_approver_user_id ?? "— top of chain —"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
