// Zod schemas for every entity + create/update variants.
// Per CLAUDE.md: "All API inputs validated with Zod before any logic."

import { z } from "zod";

// ─── Common ──────────────────────────────────────────────────────────────────

export const IDSchema = z.string().min(1);
export const ISODateSchema = z.string().datetime();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[0-9]{8,15}$/);

export const UserRoleSchema = z.enum([
  "client",
  "supplier",
  "admin",
  "ops",
  "finance",
  "cs",
]);
export const PublicRoleSchema = z.enum(["client", "supplier"]);
export const LanguageSchema = z.enum(["en", "ar"]);
export const PackTypeSchema = z.enum(["Each", "Box", "Carton"]);
export const FulfillmentModeSchema = z.enum(["express", "market"]);
export const AutoQuoteReviewWindowSchema = z.enum(["instant", "30min", "2hr"]);
export const RFQSourceSchema = z.enum(["catalog", "custom_request"]);
export const AddressTypeSchema = z.enum(["delivery", "billing"]);
export const SignupSourceSchema = z.enum(["client_form", "supplier_form", "admin_invited"]);

// ─── Identity ────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: IDSchema,
  email: EmailSchema,
  role: UserRoleSchema,
  real_name: z.string().min(1),
  phone: PhoneSchema,
  platform_alias: z.string().min(1),
  company_id: IDSchema.nullable(),
  status: z.enum([
    "pending_callback",
    "callback_completed",
    "pending_kyc",
    "active",
    "suspended",
  ]),
  activation_status: z.enum(["awaiting_callback", "callback_completed", "activated"]),
  callback_notes: z.string().nullable(),
  activation_token: z.string().nullable(),
  language: LanguageSchema,
  onboarding_completed: z.boolean(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export const RegisterPublicSchema = z.object({
  email: EmailSchema,
  real_name: z.string().min(2),
  phone: PhoneSchema,
  role: PublicRoleSchema,
  company_real_name: z.string().min(2),
  signup_intent: z.string().nullable().optional(),
  expected_monthly_volume_sar: z.number().int().positive().nullable().optional(),
  language: LanguageSchema.default("en"),
});

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6),
});

export const ActivateAccountSchema = z.object({
  activation_token: z.string().min(8),
  password: z.string().min(8),
});

export const CompanySchema = z.object({
  id: IDSchema,
  real_name: z.string().min(1),
  platform_alias: z.string().min(1),
  type: z.enum(["client", "supplier"]),
  cr_number: z.string().nullable(),
  vat_number: z.string().nullable(),
  status: z.enum(["pending_kyc", "active", "suspended"]),
  kyc_docs: z.array(z.unknown()),
  categories_served: z.array(IDSchema).optional(),
  signup_source: SignupSourceSchema,
  signup_intent: z.string().nullable(),
  expected_monthly_volume_sar: z.number().nullable(),
  subscription_tier: z.string(),
  onboarding_completed: z.boolean(),
  auto_quote_review_window: AutoQuoteReviewWindowSchema.optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

// ─── Master catalog ──────────────────────────────────────────────────────────

export const CategorySchema = z.object({
  id: IDSchema,
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  slug: z.string().min(1),
  parent_id: IDSchema.nullable().optional(),
  icon_url: z.string(),
  sort_order: z.number().int(),
});

export const CreateCategorySchema = CategorySchema.omit({ id: true });

export const MasterProductSchema = z.object({
  id: IDSchema,
  master_product_code: z.string().regex(/^MWRD-PROD-\d{5}$/),
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  description_en: z.string(),
  description_ar: z.string(),
  category_id: IDSchema,
  specs: z.record(z.string(), z.string()),
  images: z.array(z.string()),
  pack_types: z.array(PackTypeSchema).min(1),
  default_unit: z.string(),
  status: z.enum(["active", "deprecated"]),
  created_by_admin_id: IDSchema,
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export const CreateMasterProductSchema = MasterProductSchema.omit({
  id: true,
  master_product_code: true,
  created_at: true,
  updated_at: true,
});

// ─── Offers ──────────────────────────────────────────────────────────────────

export const OfferPackPriceSchema = z.object({
  pack_type: PackTypeSchema,
  supplier_cost_sar: z.number().positive(),
  min_order_qty: z.number().int().positive(),
});

export const OfferSchema = z.object({
  id: IDSchema,
  master_product_id: IDSchema,
  supplier_company_id: IDSchema,
  pack_type_pricing: z.array(OfferPackPriceSchema).min(1),
  default_lead_time_days: z.number().int().nonnegative(),
  available_quantity_estimate: z.number().int().nullable(),
  auto_quote_enabled: z.boolean(),
  fulfillment_mode: FulfillmentModeSchema,
  status: z.enum(["active", "inactive"]),
  approval_status: z.enum(["pending", "approved", "rejected"]),
  supplier_internal_sku: z.string().nullable(),
  supplier_notes: z.string().nullable(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export const CreateOfferSchema = OfferSchema.omit({
  id: true,
  approval_status: true,
  created_at: true,
  updated_at: true,
});

export const CreateProductAdditionRequestSchema = z.object({
  supplier_company_id: IDSchema,
  proposed_name_en: z.string().min(1),
  proposed_name_ar: z.string().min(1),
  proposed_category_id: IDSchema,
  proposed_description: z.string(),
  proposed_specs: z.record(z.string(), z.string()),
  sample_images: z.array(z.string()),
  reason_for_addition: z.string().min(1),
  estimated_demand: z.string().nullable().optional(),
});

// ─── Carts & catalogs ────────────────────────────────────────────────────────

export const CartItemSchema = z.object({
  id: IDSchema,
  cart_id: IDSchema,
  master_product_id: IDSchema,
  qty: z.number().int().positive(),
  pack_type: PackTypeSchema,
});

export const AddToCartSchema = z.object({
  master_product_id: IDSchema,
  qty: z.number().int().positive(),
  pack_type: PackTypeSchema,
});

// ─── RFQ + quoting ───────────────────────────────────────────────────────────

export const CreateRFQItemSchema = z
  .object({
    master_product_id: IDSchema.nullable().optional(),
    free_text_name: z.string().nullable().optional(),
    description: z.string(),
    qty: z.number().int().positive(),
    unit: z.string(),
    pack_type: PackTypeSchema.nullable().optional(),
    specs_overrides: z.string().nullable().optional(),
  })
  .refine(
    (item) => Boolean(item.master_product_id) || Boolean(item.free_text_name),
    { message: "RFQ item requires either master_product_id or free_text_name" },
  );

export const CreateRFQSchema = z.object({
  client_company_id: IDSchema,
  created_by_user_id: IDSchema,
  title: z.string().min(1),
  description: z.string(),
  category_id: IDSchema.nullable().optional(),
  delivery_city: z.string().min(1),
  delivery_date: ISODateSchema,
  source: RFQSourceSchema,
  items: z.array(CreateRFQItemSchema).min(1),
});

export const CreateQuoteItemSchema = z.object({
  rfq_item_id: IDSchema,
  offer_id: IDSchema.nullable().optional(),
  supplier_unit_price_sar: z.number().nonnegative(),
  qty_available: z.number().int().nonnegative(),
  lead_time_days: z.number().int().nonnegative(),
  notes: z.string().default(""),
  declined: z.boolean().default(false),
});

export const CreateQuoteSchema = z.object({
  rfq_id: IDSchema,
  supplier_company_id: IDSchema,
  valid_until: ISODateSchema,
  items: z.array(CreateQuoteItemSchema).min(1),
  notes: z.string().default(""),
});

// ─── Account management ─────────────────────────────────────────────────────

export const InviteCompanyMemberSchema = z.object({
  company_id: IDSchema,
  email: EmailSchema,
  real_name: z.string().min(1),
  phone: PhoneSchema,
  company_role_id: IDSchema,
});

export const SetDirectApproverSchema = z.object({
  company_id: IDSchema,
  member_user_id: IDSchema,
  direct_approver_user_id: IDSchema.nullable(),
});

export const CreateAddressSchema = z.object({
  company_id: IDSchema,
  type: AddressTypeSchema,
  label: z.string().min(1),
  national_address_code: z.string(),
  address_code: z.string(),
  full_address: z.string().min(1),
  phone: PhoneSchema,
  is_default: z.boolean().default(false),
});

// ─── Admin / settings ───────────────────────────────────────────────────────

export const SetMarginSchema = z.object({
  scope: z.enum(["global", "category", "client"]),
  scope_id: IDSchema.optional(),
  pct: z.number().min(0).max(200),
});

export const PlatformSettingsSchema = z.object({
  vat_rate: z.number().min(0).max(1),
  default_lead_time_days: z.number().int().positive(),
  rfq_expiry_days: z.number().int().positive(),
  auto_quote_admin_hold_threshold_sar: z.number().nonnegative(),
  auto_quote_globally_enabled: z.boolean(),
});

// ─── Pagination ─────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(25).default(25),
});
