// Quote Manager — the central operations page.
// Margins config + admin-held quotes + auto-quote monitor.

import { data } from "@mwrd/shared";

import { MarginConfig } from "@/components/MarginConfig";
import { HeldQuoteCard } from "@/components/HeldQuoteCard";
import { TickAutoSendButton } from "@/components/TickAutoSendButton";

export default async function Page() {
  const allCategories = await data.listCategories();
  const tops = allCategories.filter((c) => c.parent_id === null);

  // Margins
  const marginsList: import("@mwrd/shared").Margin[] = [];
  for (const m of [
    await data.getMargin({ scope: "global" }),
    ...(await Promise.all(
      tops.map((c) => data.getMargin({ scope: "category", scope_id: c.id })),
    )),
  ]) {
    if (m) marginsList.push(m);
  }
  const globalMargin = marginsList.find((m) => m.scope === "global")?.pct ?? 15;
  const catMargins = tops.map((c) => ({
    id: c.id,
    name_en: c.name_en,
    pct: marginsList.find((m) => m.scope === "category" && m.scope_id === c.id)?.pct ?? null,
  }));

  // Held quotes (auto-quotes >25k SAR threshold + supplier-submitted manual quotes pending review)
  const held = await data.listAdminHeldQuotes();
  const heldRich = await Promise.all(
    held.map(async (q) => {
      const rfq = await data.getRFQ(q.rfq_id);
      const supplierCompany = await data.getCompany(q.supplier_company_id);
      const clientCompany = rfq ? await data.getCompany(rfq.client_company_id) : null;
      const cat = rfq?.category_id
        ? allCategories.find((c) => c.id === rfq.category_id)
        : null;
      const items = await Promise.all(
        q.items.map(async (qi) => {
          const ri = rfq?.items.find((x) => x.id === qi.rfq_item_id);
          const product = ri?.master_product_id
            ? await data.getMasterProduct(ri.master_product_id)
            : null;
          return {
            quote_item_id: qi.id,
            display_name: product?.name_en ?? ri?.free_text_name ?? "Custom item",
            qty: qi.qty_available,
            supplier_unit_price_sar: qi.supplier_unit_price_sar,
            initial_final_unit_price_sar: qi.final_unit_price_sar,
            lead_time_days: qi.lead_time_days,
          };
        }),
      );
      return {
        q,
        rfq,
        supplier_real_name: supplierCompany?.real_name ?? "—",
        client_real_name: clientCompany?.real_name ?? "—",
        category_name: cat?.name_en ?? "uncategorized",
        items,
      };
    }),
  );

  // Pending auto-quote drafts (not yet at admin)
  const pendingAuto = await data.listPendingAutoQuotes();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Quote Manager</h1>
        <TickAutoSendButton />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Global Margin Configuration
        </h2>
        <MarginConfig global_pct={globalMargin} categories={catMargins} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Quotes Pending Review
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Auto-quotes flagged for admin review (above SAR 25,000 threshold) and
          manual quotes from suppliers.
        </p>
        <div className="mt-3 space-y-2">
          {heldRich.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-600">
              No quotes waiting on admin.
            </div>
          ) : (
            heldRich.map(({ q, rfq, supplier_real_name, client_real_name, category_name, items }) => (
              <HeldQuoteCard
                key={q.id}
                quote_id={q.id}
                quote_number={q.quote_number}
                rfq_number={rfq?.rfq_number ?? "—"}
                category_name={category_name}
                supplier_real_name={supplier_real_name}
                client_real_name={client_real_name}
                submitted_at={q.submitted_at}
                items={items}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Pending Auto-Quotes (health monitor)
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          View-only. Auto-quotes still in supplier review window. Will route
          automatically once the window expires.
        </p>
        {pendingAuto.length === 0 ? (
          <p className="mt-3 text-xs text-gray-500">Nothing in flight.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-3">Quote</th>
                  <th className="p-3">Supplier company</th>
                  <th className="p-3">Auto-send at</th>
                  <th className="p-3">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingAuto.map((q) => (
                  <tr key={q.id}>
                    <td className="p-3 font-mono text-xs text-gray-900">{q.quote_number}</td>
                    <td className="p-3 font-mono text-xs text-gray-700">
                      {q.supplier_company_id.slice(0, 8)}…
                    </td>
                    <td className="p-3 text-gray-600">
                      {q.auto_send_at
                        ? new Date(q.auto_send_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-gray-600">{q.items.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
