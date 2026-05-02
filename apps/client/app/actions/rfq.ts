"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export interface SubmitCartRFQInput {
  title: string;
  description: string;
  delivery_city: string;
  delivery_date: string;
}

export async function submitCartAsRFQAction(input: SubmitCartRFQInput): Promise<void> {
  const user = await getViewer();
  const rfq = await data.submitCartAsRFQ({
    user_id: user.id,
    title: input.title,
    description: input.description,
    delivery_city: input.delivery_city,
    delivery_date: new Date(input.delivery_date).toISOString(),
  });
  revalidatePath("/rfqs");
  revalidatePath("/cart");
  redirect(`/rfqs/${rfq.id}`);
}

export interface CustomRFQInput {
  title: string;
  description: string;
  category_id?: string | null;
  delivery_city: string;
  delivery_date: string;
  items: Array<{
    free_text_name: string;
    description: string;
    qty: number;
    unit: string;
  }>;
}

export async function submitCustomRFQAction(input: CustomRFQInput): Promise<void> {
  const user = await getViewer();
  if (!user.company_id) throw new Error("User has no company");
  const rfq = await data.createRFQ({
    client_company_id: user.company_id,
    created_by_user_id: user.id,
    title: input.title,
    description: input.description,
    category_id: input.category_id ?? null,
    delivery_city: input.delivery_city,
    delivery_date: new Date(input.delivery_date).toISOString(),
    source: "custom_request",
    items: input.items.map((it) => ({
      master_product_id: null,
      free_text_name: it.free_text_name,
      description: it.description,
      qty: it.qty,
      unit: it.unit,
      pack_type: null,
    })),
  });
  revalidatePath("/rfqs");
  redirect(`/rfqs/${rfq.id}`);
}

export async function tickAutoSendAction(): Promise<void> {
  // Test helper: fast-forward all draft_auto quotes through the auto-send queue.
  await data.tickAutoSend(new Date(Date.now() + 24 * 3600 * 1000));
  revalidatePath("/rfqs");
}

export async function awardFullBasketAction(quote_id: string): Promise<void> {
  const user = await getViewer();
  await data.acceptQuoteFullBasket(user.id, quote_id);
  revalidatePath("/orders");
  redirect("/orders");
}

export async function awardPerLineAction(
  selections: { quote_id: string; quote_item_id: string }[],
): Promise<void> {
  const user = await getViewer();
  await data.acceptQuotesPerLine(user.id, selections);
  revalidatePath("/orders");
  redirect("/orders");
}

export async function approveOrderAction(task_id: string): Promise<void> {
  await data.approveOrder(task_id);
  revalidatePath("/orders");
}

export async function rejectOrderAction(task_id: string, note: string): Promise<void> {
  await data.rejectOrder(task_id, note);
  revalidatePath("/orders");
}

export async function createGRNAction(input: {
  cpo_id: string;
  dn_id: string;
  items: { po_item_id: string; qty_received: number; condition: "ok" | "damaged" | "partial" }[];
  notes: string;
}): Promise<void> {
  const user = await getViewer();
  await data.createGRN({
    cpo_id: input.cpo_id,
    dn_id: input.dn_id,
    received_by_user_id: user.id,
    items: input.items,
    notes: input.notes,
  });
  revalidatePath(`/orders/${input.cpo_id}`);
}
