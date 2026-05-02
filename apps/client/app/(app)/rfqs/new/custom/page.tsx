// Custom Request: free-text items, no master_product_id.

import { data } from "@mwrd/shared";

import { CustomRFQForm } from "@/components/CustomRFQForm";

export default async function Page() {
  const all = await data.listCategories();
  const tops = all
    .filter((c) => c.parent_id === null)
    .map((c) => ({ id: c.id, name_en: c.name_en }));
  const defaultDate = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Submit a Custom Request</h1>
        <p className="mt-1 text-sm text-gray-600">
          For items not in our catalog. Tell us what you need; we&apos;ll source quotes from
          suppliers in our network.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <CustomRFQForm categories={tops} defaultDate={defaultDate} />
      </div>
    </div>
  );
}
