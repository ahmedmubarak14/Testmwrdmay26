"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { data } from "@mwrd/shared";
import type { FulfillmentMode, PackType } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export interface SaveOfferInput {
  master_product_id: string;
  pack_type_pricing: { pack_type: PackType; supplier_cost_sar: number; min_order_qty: number }[];
  default_lead_time_days: number;
  available_quantity_estimate: number | null;
  auto_quote_enabled: boolean;
  fulfillment_mode: FulfillmentMode;
  supplier_internal_sku: string | null;
  supplier_notes: string | null;
}

export async function saveOfferAction(input: SaveOfferInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await getViewer();
    if (!user.company_id) throw new Error("User has no company");
    const existing = await data.findOfferByProduct(user.company_id, input.master_product_id);
    if (existing) {
      await data.updateOffer(existing.id, {
        pack_type_pricing: input.pack_type_pricing,
        default_lead_time_days: input.default_lead_time_days,
        available_quantity_estimate: input.available_quantity_estimate,
        auto_quote_enabled: input.auto_quote_enabled,
        fulfillment_mode: input.fulfillment_mode,
        supplier_internal_sku: input.supplier_internal_sku,
        supplier_notes: input.supplier_notes,
      });
    } else {
      await data.createOffer({
        master_product_id: input.master_product_id,
        supplier_company_id: user.company_id,
        pack_type_pricing: input.pack_type_pricing,
        default_lead_time_days: input.default_lead_time_days,
        available_quantity_estimate: input.available_quantity_estimate,
        auto_quote_enabled: input.auto_quote_enabled,
        fulfillment_mode: input.fulfillment_mode,
        status: "active",
        supplier_internal_sku: input.supplier_internal_sku,
        supplier_notes: input.supplier_notes,
      });
    }
    revalidatePath("/rate-card");
    revalidatePath(`/catalog/products/${input.master_product_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function toggleAutoQuoteAction(offer_id: string, enabled: boolean): Promise<void> {
  await data.toggleAutoQuote(offer_id, enabled);
  revalidatePath("/rate-card");
}

export async function pauseOfferAction(offer_id: string): Promise<void> {
  await data.pauseOffer(offer_id);
  revalidatePath("/rate-card");
}

export async function resumeOfferAction(offer_id: string): Promise<void> {
  await data.resumeOffer(offer_id);
  revalidatePath("/rate-card");
}

export interface RateCardSettingsInput {
  auto_quote_review_window: "instant" | "30min" | "2hr";
  auto_quote_globally_enabled: boolean;
  default_lead_time_pad_days: number;
}

export async function saveRateCardSettingsAction(
  input: RateCardSettingsInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await getViewer();
    if (!user.company_id) throw new Error("User has no company");
    await data.updateRateCardSettings(user.company_id, {
      auto_quote_review_window: input.auto_quote_review_window,
      auto_quote_globally_enabled: input.auto_quote_globally_enabled,
      default_lead_time_pad_days: input.default_lead_time_pad_days,
    });
    revalidatePath("/rate-card/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export interface ProductAdditionRequestInput {
  proposed_name_en: string;
  proposed_name_ar: string;
  proposed_category_id: string;
  proposed_description: string;
  proposed_specs: Record<string, string>;
  reason_for_addition: string;
  estimated_demand: string | null;
}

export async function submitPARAction(input: ProductAdditionRequestInput): Promise<void> {
  const user = await getViewer();
  if (!user.company_id) throw new Error("User has no company");
  await data.createProductAdditionRequest({
    requested_by_user_id: user.id,
    supplier_company_id: user.company_id,
    proposed_name_en: input.proposed_name_en,
    proposed_name_ar: input.proposed_name_ar,
    proposed_category_id: input.proposed_category_id,
    proposed_description: input.proposed_description,
    proposed_specs: input.proposed_specs,
    sample_images: [],
    reason_for_addition: input.reason_for_addition,
    estimated_demand: input.estimated_demand,
  });
  revalidatePath("/product-requests");
  redirect("/product-requests");
}

export interface SubmitQuoteInput {
  quote_id: string;
  notes: string;
  valid_until: string;
  items: Array<{
    quote_item_id: string;
    supplier_unit_price_sar: number;
    qty_available: number;
    lead_time_days: number;
    notes: string;
    declined: boolean;
  }>;
}

export async function submitQuoteAction(input: SubmitQuoteInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const quote = await data.getQuote(input.quote_id);
    if (!quote) throw new Error("Quote not found");

    const updatedItems = quote.items.map((qi) => {
      const patch = input.items.find((x) => x.quote_item_id === qi.id);
      if (!patch) return qi;
      // Recompute final_unit_price_sar with same supplier:final ratio used at draft time.
      // Phase 2 will resolve this server-side via resolveMargin(); for the MVP we
      // preserve the existing margin ratio if it was set, else apply 15% as default.
      const ratio =
        qi.final_unit_price_sar > 0 && qi.supplier_unit_price_sar > 0
          ? qi.final_unit_price_sar / qi.supplier_unit_price_sar
          : 1.15;
      return {
        ...qi,
        supplier_unit_price_sar: patch.supplier_unit_price_sar,
        final_unit_price_sar:
          Math.round(patch.supplier_unit_price_sar * ratio * 100) / 100,
        qty_available: patch.qty_available,
        lead_time_days: patch.lead_time_days,
        notes: patch.notes,
        declined: patch.declined,
      };
    });

    await data.editQuoteBeforeSend(input.quote_id, {
      items: updatedItems,
      notes: input.notes,
      valid_until: new Date(input.valid_until).toISOString(),
    });
    await data.sendQuoteNow(input.quote_id);
    revalidatePath("/quotes");
    revalidatePath("/rfqs");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Submit failed" };
  }
}

export async function createDNAction(input: {
  spo_id: string;
  courier: string;
  tracking_number: string;
  expected_delivery_date: string;
  items: { po_item_id: string; qty_dispatched: number }[];
}): Promise<void> {
  await data.createDN({
    spo_id: input.spo_id,
    courier: input.courier,
    tracking_number: input.tracking_number,
    expected_delivery_date: new Date(input.expected_delivery_date).toISOString(),
    items: input.items,
  });
  revalidatePath(`/orders/${input.spo_id}`);
  redirect(`/orders/${input.spo_id}`);
}
