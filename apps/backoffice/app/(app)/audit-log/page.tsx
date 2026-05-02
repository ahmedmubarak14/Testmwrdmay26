// Audit Log — superadmin only.

import { redirect } from "next/navigation";

import { data } from "@mwrd/shared";

import { getViewer, isSuperadmin } from "@/lib/viewer";

export default async function Page() {
  const viewer = await getViewer();
  if (!isSuperadmin(viewer)) redirect("/dashboard");

  const log = await data.listAuditLog();
  const allUsers = await data.listAllUsers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Every backoffice action is logged.
        </p>
      </div>

      {log.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No audit events yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {log.slice(0, 200).map((entry) => {
                const actor = allUsers.find((u) => u.id === entry.actor_user_id);
                return (
                  <tr key={entry.id} className="align-top">
                    <td className="p-3 text-gray-600">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <p className="text-gray-700">{actor?.real_name ?? "—"}</p>
                      <p className="text-[11px] text-gray-500">{actor?.role ?? ""}</p>
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-900">{entry.action}</td>
                    <td className="p-3 font-mono text-xs text-gray-700">
                      {entry.entity_type}/{entry.entity_id.slice(0, 8)}…
                    </td>
                    <td className="p-3">
                      <details>
                        <summary className="cursor-pointer text-xs text-gray-600 underline-offset-2 hover:underline">
                          View
                        </summary>
                        <pre className="mt-1 max-w-md whitespace-pre-wrap break-all rounded-md bg-gray-50 p-2 text-[10px] text-gray-700">
                          {JSON.stringify(entry.after ?? entry.before ?? {}, null, 2)}
                        </pre>
                      </details>
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
