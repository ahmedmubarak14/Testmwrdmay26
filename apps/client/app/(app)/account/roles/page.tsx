import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { AccountTabs } from "@/components/AccountTabs";

export default async function Page() {
  const user = await getViewer();
  const roles = await data.listCompanyRoles(user.company_id ?? "");

  return (
    <div className="space-y-4">
      <AccountTabs current="roles" />
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
        <button
          type="button"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No custom roles defined. Defaults are applied to invited users.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">{r.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {r.permissions.length} permissions
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
