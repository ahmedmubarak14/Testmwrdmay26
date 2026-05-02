"use server";

import { revalidatePath } from "next/cache";

import { data } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

// ─── Leads / KYC ────────────────────────────────────────────────────────────

export async function markCallbackCompleteAction(input: {
  user_id: string;
  notes: string;
}): Promise<{ ok: boolean; activation_token?: string; error?: string }> {
  try {
    const actor = await getViewer();
    const updated = await data.markCallbackComplete(input.user_id, input.notes);
    await data.appendAuditLog({
      actor_user_id: actor.id,
      action: "mark_callback_complete",
      entity_type: "user",
      entity_id: input.user_id,
      after: { activation_token: updated.activation_token, notes: input.notes },
    });
    // Phase 3: send email; Phase 1 logs the link.
    // eslint-disable-next-line no-console
    console.log(
      `[backoffice] activation link for ${updated.email}: /activate?token=${updated.activation_token}`,
    );
    revalidatePath("/leads");
    revalidatePath("/kyc");
    return { ok: true, activation_token: updated.activation_token ?? undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function approveKYCAction(company_id: string): Promise<void> {
  const actor = await getViewer();
  const before = await data.getCompany(company_id);
  const after = await data.approveKYC(company_id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "approve_kyc",
    entity_type: "company",
    entity_id: company_id,
    before: { status: before?.status },
    after: { status: after.status },
  });
  revalidatePath("/kyc");
}

export async function rejectKYCAction(company_id: string): Promise<void> {
  const actor = await getViewer();
  const before = await data.getCompany(company_id);
  const after = await data.rejectKYC(company_id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "reject_kyc",
    entity_type: "company",
    entity_id: company_id,
    before: { status: before?.status },
    after: { status: after.status },
  });
  revalidatePath("/kyc");
}

// ─── Offer approvals ────────────────────────────────────────────────────────

export async function approveOfferAction(offer_id: string): Promise<void> {
  const actor = await getViewer();
  const before = await data.getOffer(offer_id);
  const after = await data.approveOffer(offer_id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "approve_offer",
    entity_type: "offer",
    entity_id: offer_id,
    before: { approval_status: before?.approval_status },
    after: { approval_status: after.approval_status },
  });
  revalidatePath("/offer-approvals");
}

export async function rejectOfferAction(offer_id: string, _reason: string): Promise<void> {
  const actor = await getViewer();
  const after = await data.rejectOffer(offer_id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "reject_offer",
    entity_type: "offer",
    entity_id: offer_id,
    after: { approval_status: after.approval_status, reason: _reason },
  });
  revalidatePath("/offer-approvals");
}

// ─── Product Addition Requests ──────────────────────────────────────────────

export async function approvePARAction(input: {
  par_id: string;
  master_product: {
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    category_id: string;
    specs: Record<string, string>;
    pack_types: ("Each" | "Box" | "Carton")[];
    default_unit: string;
  };
}): Promise<void> {
  const actor = await getViewer();
  const created = await data.createMasterProduct({
    ...input.master_product,
    images: [],
    status: "active",
    created_by_admin_id: actor.id,
  });
  await data.approveProductAdditionRequest(input.par_id, actor.id, created.id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "approve_product_addition_request",
    entity_type: "product_addition_request",
    entity_id: input.par_id,
    after: { resulting_master_product_id: created.id },
  });
  revalidatePath("/product-requests");
  revalidatePath("/master-catalog");
}

export async function rejectPARAction(par_id: string, reason: string): Promise<void> {
  const actor = await getViewer();
  await data.rejectProductAdditionRequest(par_id, actor.id, reason);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "reject_product_addition_request",
    entity_type: "product_addition_request",
    entity_id: par_id,
    after: { rejection_reason: reason },
  });
  revalidatePath("/product-requests");
}

// ─── Master catalog ─────────────────────────────────────────────────────────

export async function createMasterProductAction(input: {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  specs: Record<string, string>;
  pack_types: ("Each" | "Box" | "Carton")[];
  default_unit: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const actor = await getViewer();
    const created = await data.createMasterProduct({
      ...input,
      images: [],
      status: "active",
      created_by_admin_id: actor.id,
    });
    await data.appendAuditLog({
      actor_user_id: actor.id,
      action: "create_master_product",
      entity_type: "master_product",
      entity_id: created.id,
      after: { name_en: created.name_en, code: created.master_product_code },
    });
    revalidatePath("/master-catalog");
    return { ok: true, id: created.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Create failed" };
  }
}

export async function deprecateMasterProductAction(id: string): Promise<void> {
  const actor = await getViewer();
  await data.deprecateMasterProduct(id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "deprecate_master_product",
    entity_type: "master_product",
    entity_id: id,
  });
  revalidatePath("/master-catalog");
}

// ─── Quote manager ──────────────────────────────────────────────────────────

export async function setMarginAction(input: {
  scope: "global" | "category" | "client";
  scope_id?: string;
  pct: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await getViewer();
    await data.setMargin({
      scope: input.scope,
      scope_id: input.scope_id,
      pct: input.pct,
      updated_by_user_id: actor.id,
    });
    await data.appendAuditLog({
      actor_user_id: actor.id,
      action: "set_margin",
      entity_type: "margin",
      entity_id: input.scope_id ?? "global",
      after: input,
    });
    revalidatePath("/quote-manager");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function approveAdminHeldQuoteAction(input: {
  quote_id: string;
  margin_overrides: Record<string, number>; // quote_item_id -> final_unit_price_sar
}): Promise<void> {
  const actor = await getViewer();
  if (Object.keys(input.margin_overrides).length > 0) {
    await data.setQuoteMarginOverride(input.quote_id, input.margin_overrides);
  }
  await data.approveAdminHeldQuote(input.quote_id);
  await data.appendAuditLog({
    actor_user_id: actor.id,
    action: "approve_admin_held_quote",
    entity_type: "quote",
    entity_id: input.quote_id,
    after: { margin_overrides: input.margin_overrides },
  });
  revalidatePath("/quote-manager");
}

// ─── Tickle the auto-quote queue (testing helper) ──────────────────────────

export async function tickAutoSendAction(): Promise<void> {
  await data.tickAutoSend(new Date(Date.now() + 24 * 3600 * 1000));
  revalidatePath("/quote-manager");
  revalidatePath("/dashboard");
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function savePlatformSettingsAction(input: {
  vat_rate: number;
  default_lead_time_days: number;
  rfq_expiry_days: number;
  auto_quote_admin_hold_threshold_sar: number;
  auto_quote_globally_enabled: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await getViewer();
    const before = await data.getPlatformSettings();
    const after = await data.updatePlatformSettings(input);
    await data.appendAuditLog({
      actor_user_id: actor.id,
      action: "update_platform_settings",
      entity_type: "platform_settings",
      entity_id: "platform_settings",
      before,
      after,
    });
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}
