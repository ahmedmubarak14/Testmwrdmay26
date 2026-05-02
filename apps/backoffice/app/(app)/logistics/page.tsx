// Logistics Oversight.
// Backoffice sees both client and supplier real_names.

import { data } from "@mwrd/shared";

import { StatusBadge } from "@/components/StatusBadge";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = sp.tab === "delayed" ? "delayed" : sp.tab === "delivered" ? "delivered" : "in_transit";

  const dns = await data.listAllDNs();

  // Resolve each DN's parent SPO + supplier + linked CPO + client.
  const decorated = await Promise.all(
    dns.map(async (dn) => {
      const spo = await data.getPO(dn.spo_id);
      const supplierCompany = spo ? await data.getCompany(spo.supplier_company_id) : null;
      const clientCompany = spo ? await data.getCompany(spo.client_company_id) : null;
      return {
        dn,
        spo_status: spo?.status ?? "unknown",
        spo_number: spo?.po_number ?? "—",
        supplier_real_name: supplierCompany?.real_name ?? "—",
        client_alias: clientCompany?.platform_alias ?? "—",
      };
    }),
  );

  const now = Date.now();
  const filtered = decorated.filter(({ dn, spo_status }) => {
    if (tab === "delivered") {
      const cutoff = now - 7 * 24 * 3600 * 1000;
      return spo_status === "delivered" && new Date(dn.dispatch_date).getTime() >= cutoff;
    }
    if (tab === "delayed") {
      return new Date(dn.expected_delivery_date).getTime() < now && spo_status === "in_transit";
    }
    return spo_status === "in_transit";
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Logistics Oversight</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4 text-sm">
          {[
            { key: "in_transit", label: "In Transit" },
            { key: "delayed", label: "Delayed" },
            { key: "delivered", label: "Delivered Last 7 Days" },
          ].map((t) => (
            <a
              key={t.key}
              href={`/logistics?tab=${t.key}`}
              className={`inline-block border-b-2 px-1 pb-2 ${
                tab === t.key
                  ? "border-gray-900 font-semibold text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          Nothing in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">SPO</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Client</th>
                <th className="p-3">Courier</th>
                <th className="p-3">Tracking</th>
                <th className="p-3">Dispatch</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(({ dn, spo_status, spo_number, supplier_real_name, client_alias }) => (
                <tr key={dn.id}>
                  <td className="p-3 font-mono text-xs text-gray-900">{spo_number}</td>
                  <td className="p-3 text-gray-700">{supplier_real_name}</td>
                  <td className="p-3 font-mono text-xs text-gray-700">{client_alias}</td>
                  <td className="p-3 text-gray-700">{dn.courier}</td>
                  <td className="p-3 font-mono text-xs text-gray-700">
                    {dn.tracking_number}
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(dn.dispatch_date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-gray-600">
                    {new Date(dn.expected_delivery_date).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={spo_status} />
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
