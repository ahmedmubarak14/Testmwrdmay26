import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { data } from "@mwrd/shared";

import { DNForm } from "@/components/DNForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const po = await data.getPO(id);
  if (!po) notFound();
  if (po.type !== "SPO" || po.status !== "confirmed") {
    redirect(`/orders/${id}`);
  }

  return (
    <div className="space-y-4">
      <Link href={`/orders/${id}`} className="text-xs text-gray-500 hover:underline">
        ← Back to order
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create Delivery Note</h1>
        <p className="mt-1 text-sm text-gray-600">
          For order <span className="font-mono">{po.po_number}</span>.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <DNForm
          spo_id={po.id}
          items={po.items.map((it) => ({
            po_item_id: it.id,
            description: it.description || it.free_text_name || "Item",
            qty: it.qty,
          }))}
        />
      </div>
    </div>
  );
}
