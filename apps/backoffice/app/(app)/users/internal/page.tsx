// Internal Users — superadmin only.

import { redirect } from "next/navigation";

import { data } from "@mwrd/shared";

import { getViewer, isSuperadmin } from "@/lib/viewer";
import { StatusBadge } from "@/components/StatusBadge";
import { InviteInternalForm } from "@/components/InviteInternalForm";

export default async function Page() {
  const viewer = await getViewer();
  if (!isSuperadmin(viewer)) redirect("/dashboard");

  const internals = await data.listInternalUsers();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Internal Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            MWRD team members with backoffice access.
          </p>
        </div>
        <InviteInternalForm />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {internals.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-medium text-gray-900">{u.real_name}</td>
                <td className="p-3 text-gray-700">{u.email}</td>
                <td className="p-3 text-gray-700">{u.role}</td>
                <td className="p-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="p-3 text-gray-600">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
