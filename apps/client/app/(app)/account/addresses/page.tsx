import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";
import { AccountTabs } from "@/components/AccountTabs";

export default async function Page() {
  const user = await getViewer();
  const addresses = await data.listAddresses(user.company_id ?? "");

  return (
    <div className="space-y-4">
      <AccountTabs current="addresses" />
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Addresses</h1>
        <button
          type="button"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No addresses on file. Add a delivery and billing address to enable orders.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              <p className="mt-1 text-xs text-gray-600">{a.full_address}</p>
              <p className="mt-2 text-[11px] text-gray-500">
                {a.type} · National {a.national_address_code} · Code {a.address_code}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
