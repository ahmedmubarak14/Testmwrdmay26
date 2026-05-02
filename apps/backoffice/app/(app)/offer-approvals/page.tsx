// Offer Approvals. Backoffice sees supplier real_name (and company real_name).

import { data } from "@mwrd/shared";

import { OfferApprovalActions } from "@/components/OfferApprovalActions";

export default async function Page() {
  const offers = await data.listOfferApprovalQueue();
  const decorated = await Promise.all(
    offers.map(async (o) => ({
      offer: o,
      product: await data.getMasterProduct(o.master_product_id),
      company: await data.getCompany(o.supplier_company_id),
    })),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Offer Approvals</h1>
        <p className="mt-1 text-sm text-gray-600">
          New supplier offers awaiting admin verification.
        </p>
      </div>

      {decorated.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
          No pending offers — all caught up.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="p-3">Master Product</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Cost range (SAR)</th>
                <th className="p-3">Lead time</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {decorated.map(({ offer, product, company }) => {
                const prices = offer.pack_type_pricing.map((p) => p.supplier_cost_sar);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return (
                  <tr key={offer.id}>
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{product?.name_en ?? "—"}</p>
                      <p className="text-[11px] font-mono text-gray-500">
                        {product?.master_product_code}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="text-gray-700">{company?.real_name ?? "—"}</p>
                      <p className="text-[11px] font-mono text-gray-500">
                        {company?.platform_alias}
                      </p>
                    </td>
                    <td className="p-3 text-gray-900">
                      {min === max ? min.toFixed(2) : `${min.toFixed(2)}–${max.toFixed(2)}`}
                    </td>
                    <td className="p-3 text-gray-600">{offer.default_lead_time_days}d</td>
                    <td className="p-3 text-gray-600">
                      {new Date(offer.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <OfferApprovalActions offer_id={offer.id} />
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
