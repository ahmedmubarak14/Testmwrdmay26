import Link from "next/link";

import { data } from "@mwrd/shared";

import { MasterProductForm } from "@/components/MasterProductForm";

export default async function Page() {
  const all = await data.listCategories();
  // Allow picking any category (parent or sub) for the new product.
  const flat = all.map((c) => ({ id: c.id, name_en: c.name_en, name_ar: c.name_ar }));

  return (
    <div className="space-y-4">
      <Link href="/master-catalog" className="text-xs text-gray-500 hover:underline">
        ← Back to catalog
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">New Master Product</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <MasterProductForm categories={flat} />
      </div>
    </div>
  );
}
