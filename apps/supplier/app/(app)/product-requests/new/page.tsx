import { data } from "@mwrd/shared";

import { PARForm } from "@/components/PARForm";

export default async function Page() {
  const categories = await data.listCategories();
  const tops = categories
    .filter((c) => c.parent_id === null)
    .map((c) => ({ id: c.id, name_en: c.name_en }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Submit a Product Addition Request
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tell us about a product you&apos;d like to sell that&apos;s not yet in our catalog.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <PARForm categories={tops} />
      </div>
    </div>
  );
}
