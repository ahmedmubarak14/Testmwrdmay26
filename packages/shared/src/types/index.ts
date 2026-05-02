// MWRD type contracts.
// This is the single permitted barrel file in the codebase
// (per CLAUDE.md "no barrel files except packages/shared/src/types/index.ts").

// ─── Common ──────────────────────────────────────────────────────────────────

export type ID = string;
export type ISODateString = string;

export type UserRole = "client" | "supplier" | "admin" | "ops" | "finance" | "cs";
export type UserStatus =
  | "pending_callback"
  | "callback_completed"
  | "pending_kyc"
  | "active"
  | "suspended";
export type ActivationStatus = "awaiting_callback" | "callback_completed" | "activated";
export type Language = "en" | "ar";
export type CompanyType = "client" | "supplier";
export type SignupSource = "client_form" | "supplier_form" | "admin_invited";
export type AddressType = "delivery" | "billing";
export type PackType = "Each" | "Box" | "Carton";
export type FulfillmentMode = "express" | "market";
export type AutoQuoteReviewWindow = "instant" | "30min" | "2hr";
export type RFQSource = "catalog" | "custom_request";

// ─── Identity ────────────────────────────────────────────────────────────────

export interface User {
  id: ID;
  email: string;
  role: UserRole;
  real_name: string;
  phone: string;
  platform_alias: string;
  company_id: ID | null;
  status: UserStatus;
  activation_status: ActivationStatus;
  callback_notes: string | null;
  activation_token: string | null;
  language: Language;
  onboarding_completed: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface KycDoc {
  id: ID;
  type: "cr" | "vat" | "national_address" | "bank_letter" | "other";
  filename: string;
  uploaded_at: ISODateString;
  base64_data: string;
}

export interface Company {
  id: ID;
  real_name: string;
  platform_alias: string;
  type: CompanyType;
  cr_number: string | null;
  vat_number: string | null;
  status: "pending_kyc" | "active" | "suspended";
  kyc_docs: KycDoc[];
  categories_served?: string[];
  signup_source: SignupSource;
  signup_intent: string | null;
  expected_monthly_volume_sar: number | null;
  subscription_tier: string;
  onboarding_completed: boolean;
  // Supplier-only operational defaults
  auto_quote_review_window?: AutoQuoteReviewWindow;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CompanyMember {
  id: ID;
  company_id: ID;
  user_id: ID;
  company_role_id: ID;
}

export interface CompanyRole {
  id: ID;
  company_id: ID;
  name: string;
  permissions: string[];
}

export interface ApprovalNode {
  id: ID;
  company_id: ID;
  member_user_id: ID;
  direct_approver_user_id: ID | null;
}

export interface Address {
  id: ID;
  company_id: ID;
  type: AddressType;
  label: string;
  national_address_code: string;
  address_code: string;
  full_address: string;
  phone: string;
  is_default: boolean;
}

// ─── Master catalog ──────────────────────────────────────────────────────────

export interface Category {
  id: ID;
  name_en: string;
  name_ar: string;
  slug: string;
  parent_id?: ID | null;
  icon_url: string;
  sort_order: number;
}

export interface MasterProduct {
  id: ID;
  master_product_code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: ID;
  specs: Record<string, string>;
  images: string[];
  pack_types: PackType[];
  default_unit: string;
  status: "active" | "deprecated";
  created_by_admin_id: ID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface BundleItem {
  id: ID;
  bundle_id: ID;
  master_product_id: ID;
  qty: number;
  sort_order: number;
}

export interface Bundle {
  id: ID;
  name_en: string;
  name_ar: string;
  slug: string;
  image_url: string;
  description: string;
  items: BundleItem[];
}

// ─── Supplier offers ─────────────────────────────────────────────────────────

export interface OfferPackPrice {
  pack_type: PackType;
  supplier_cost_sar: number;
  min_order_qty: number;
}

export interface Offer {
  id: ID;
  master_product_id: ID;
  supplier_company_id: ID;
  pack_type_pricing: OfferPackPrice[];
  default_lead_time_days: number;
  available_quantity_estimate: number | null;
  auto_quote_enabled: boolean;
  fulfillment_mode: FulfillmentMode;
  status: "active" | "inactive";
  approval_status: "pending" | "approved" | "rejected";
  supplier_internal_sku: string | null;
  supplier_notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ProductAdditionRequest {
  id: ID;
  requested_by_user_id: ID;
  supplier_company_id: ID;
  proposed_name_en: string;
  proposed_name_ar: string;
  proposed_category_id: ID;
  proposed_description: string;
  proposed_specs: Record<string, string>;
  sample_images: string[];
  reason_for_addition: string;
  estimated_demand: string | null;
  status: "submitted" | "under_review" | "approved" | "rejected";
  admin_notes: string | null;
  resulting_master_product_id: ID | null;
  rejection_reason: string | null;
  reviewed_by_admin_id: ID | null;
  created_at: ISODateString;
  decided_at: ISODateString | null;
}

// ─── Lists & carts ───────────────────────────────────────────────────────────

export interface FavouriteList {
  id: ID;
  user_id: ID;
  master_product_ids: ID[];
}

export interface CompanyCatalog {
  id: ID;
  company_id: ID;
  name: string;
  description: string;
  master_product_ids: ID[];
  created_by_user_id: ID;
}

export interface CartItem {
  id: ID;
  cart_id: ID;
  master_product_id: ID;
  qty: number;
  pack_type: PackType;
}

export interface Cart {
  id: ID;
  user_id: ID;
  items: CartItem[];
  status: "active" | "saved" | "expired";
  name?: string;
  expires_at?: ISODateString;
}

// ─── RFQ + quoting ───────────────────────────────────────────────────────────

export type RFQStatus =
  | "draft"
  | "open"
  | "quoted"
  | "awarded"
  | "partially_awarded"
  | "cancelled";

export interface RFQItem {
  id: ID;
  rfq_id: ID;
  master_product_id?: ID | null;
  free_text_name?: string | null;
  description: string;
  qty: number;
  unit: string;
  pack_type?: PackType | null;
  specs_overrides?: string | null;
}

export interface RFQ {
  id: ID;
  rfq_number: string;
  client_company_id: ID;
  created_by_user_id: ID;
  title: string;
  description: string;
  category_id?: ID | null;
  delivery_city: string;
  delivery_date: ISODateString;
  status: RFQStatus;
  source: RFQSource;
  items: RFQItem[];
  created_at: ISODateString;
  expires_at: ISODateString;
}

export type QuoteStatus =
  | "draft_auto"
  | "draft_manual"
  | "pending_supplier_send"
  | "pending_admin_review"
  | "submitted_to_client"
  | "accepted"
  | "partially_accepted"
  | "rejected"
  | "expired";

export interface QuoteItem {
  id: ID;
  quote_id: ID;
  rfq_item_id: ID;
  offer_id?: ID | null;
  // Server-only fields. Stripped before delivery to client/supplier as appropriate.
  supplier_unit_price_sar: number;
  final_unit_price_sar: number;
  qty_available: number;
  lead_time_days: number;
  notes: string;
  declined: boolean;
}

export interface Quote {
  id: ID;
  quote_number: string;
  rfq_id: ID;
  supplier_company_id: ID;
  status: QuoteStatus;
  is_auto_generated: boolean;
  supplier_review_window: AutoQuoteReviewWindow;
  supplier_reviewed_at: ISODateString | null;
  auto_send_at: ISODateString | null;
  admin_held: boolean;
  valid_until: ISODateString;
  lead_time_days: number;
  items: QuoteItem[];
  notes: string;
  submitted_at: ISODateString | null;
}

export interface QuoteLineSelection {
  id: ID;
  rfq_id: ID;
  quote_id: ID;
  quote_item_id: ID;
  client_user_id: ID;
  selected_at: ISODateString;
}

// ─── Orders, deliveries, invoices ────────────────────────────────────────────

export type POType = "CPO" | "SPO";

export type POStatus =
  | "draft"
  | "awaiting_approval"
  | "confirmed"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

export interface POItem {
  id: ID;
  po_id: ID;
  master_product_id: ID | null;
  free_text_name: string | null;
  description: string;
  qty: number;
  pack_type: PackType;
  unit_price_sar: number;
  // Supplier-side SPO records the supplier cost (server-only on CPO).
  supplier_unit_cost_sar?: number;
}

export interface PO {
  id: ID;
  po_number: string;
  type: POType;
  transaction_ref: string;
  rfq_id?: ID;
  source_quote_id?: ID;
  source_quote_line_selections?: ID[];
  client_company_id: ID;
  supplier_company_id: ID;
  status: POStatus;
  total_sar: number;
  items: POItem[];
  created_at: ISODateString;
}

export interface ApprovalTask {
  id: ID;
  po_id: ID;
  approver_user_id: ID;
  status: "pending" | "approved" | "rejected";
  order_in_chain: number;
  decided_at?: ISODateString;
  note?: string;
}

export interface DNItem {
  id: ID;
  dn_id: ID;
  po_item_id: ID;
  qty_dispatched: number;
}

export interface DN {
  id: ID;
  dn_number: string;
  spo_id: ID;
  courier: string;
  tracking_number: string;
  dispatch_date: ISODateString;
  expected_delivery_date: ISODateString;
  items: DNItem[];
}

export interface GRNItem {
  id: ID;
  grn_id: ID;
  po_item_id: ID;
  qty_received: number;
  condition: "ok" | "damaged" | "partial";
}

export interface GRN {
  id: ID;
  grn_number: string;
  cpo_id: ID;
  dn_id: ID;
  received_by_user_id: ID;
  received_at: ISODateString;
  items: GRNItem[];
  notes: string;
}

export interface Invoice {
  id: ID;
  invoice_number: string;
  cpo_id: ID;
  grn_id: ID;
  total_sar: number;
  vat_amount_sar: number;
  status: "draft" | "issued" | "paid" | "overdue";
  issue_date: ISODateString;
  due_date: ISODateString;
  zatca_uuid?: string;
  zatca_qr?: string;
  payment_intent_id?: string;
}

// ─── Operations ──────────────────────────────────────────────────────────────

export type MarginScope = "global" | "category" | "client";

export interface Margin {
  id: ID;
  scope: MarginScope;
  scope_id?: ID;
  pct: number;
  updated_by_user_id: ID;
  updated_at: ISODateString;
}

export interface Notification {
  id: ID;
  user_id: ID;
  type: string;
  title: string;
  body: string;
  read_at?: ISODateString;
  created_at: ISODateString;
  link?: string;
}

export interface AuditLog {
  id: ID;
  actor_user_id: ID;
  action: string;
  entity_type: string;
  entity_id: ID;
  before?: unknown;
  after?: unknown;
  created_at: ISODateString;
}

export interface PlatformSettings {
  id: ID;
  vat_rate: number;
  default_lead_time_days: number;
  rfq_expiry_days: number;
  auto_quote_admin_hold_threshold_sar: number;
  auto_quote_globally_enabled: boolean;
}

// ─── Anonymity-safe view types ───────────────────────────────────────────────
// Reads from @mwrd/shared/data return one of these depending on viewer role.

export type ClientFacingCompany = Omit<Company, "real_name" | "kyc_docs" | "cr_number" | "vat_number">;
export type SupplierFacingCompany = Omit<Company, "real_name" | "kyc_docs" | "cr_number" | "vat_number">;

// Quote view stripped of margin internals before reaching either side.
export type ClientFacingQuoteItem = Omit<QuoteItem, "supplier_unit_price_sar">;
export type SupplierFacingQuoteItem = Omit<QuoteItem, "final_unit_price_sar">;

// Seller info for ZATCA TLV (Phase 3). Stub-only in MVP.
export interface Seller {
  name: string;
  vat_number: string;
}
