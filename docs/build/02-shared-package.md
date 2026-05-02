# Prompt 2 — Shared package: types, schemas, utils, mock data

This is the contract layer. Every other prompt depends on it. **Get this right or everything downstream is wrong.**

---

Build the `@mwrd/shared` package: types, Zod schemas, utility functions, and the mock data layer that all 4 apps will read from.

## File: `packages/shared/src/types/index.ts`

Export TypeScript interfaces for these entities. Use exact field names.

### Identity

- **User**: `{ id, email, role: 'client'|'supplier'|'admin'|'ops'|'finance'|'cs', real_name, phone, platform_alias, company_id, status: 'pending_callback'|'callback_completed'|'pending_kyc'|'active'|'suspended', activation_status: 'awaiting_callback'|'callback_completed'|'activated', callback_notes: string|null, activation_token: string|null, language: 'en'|'ar', onboarding_completed: boolean, created_at, updated_at }`
- **Company**: `{ id, real_name, platform_alias, type: 'client'|'supplier', cr_number: string|null, vat_number: string|null, status, kyc_docs: KycDoc[], categories_served?: string[], signup_source: 'client_form'|'supplier_form'|'admin_invited', signup_intent: string|null, expected_monthly_volume_sar: number|null, subscription_tier: string, onboarding_completed: boolean, created_at, updated_at }`
- **CompanyMember**: `{ id, company_id, user_id, company_role_id }`
- **CompanyRole**: `{ id, company_id, name, permissions: string[] }`
- **ApprovalNode**: `{ id, company_id, member_user_id, direct_approver_user_id: string|null }`
- **Address**: `{ id, company_id, type: 'delivery'|'billing', label, national_address_code, address_code, full_address, phone, is_default }`

### Master catalog (admin-owned)

- **Category**: `{ id, name_en, name_ar, slug, parent_id?: string|null, icon_url, sort_order }`
- **MasterProduct**: `{ id, master_product_code, name_en, name_ar, description_en, description_ar, category_id, specs: Record<string,string>, images: string[], pack_types: ('Each'|'Box'|'Carton')[], default_unit, status: 'active'|'deprecated', created_by_admin_id, created_at, updated_at }`
- **Bundle**: `{ id, name_en, name_ar, slug, image_url, description, items: BundleItem[] }`
- **BundleItem**: `{ id, bundle_id, master_product_id, qty, sort_order }`

### Supplier offers

- **Offer**: `{ id, master_product_id, supplier_company_id, pack_type_pricing: { pack_type, supplier_cost_sar, min_order_qty }[], default_lead_time_days: number, available_quantity_estimate: number|null, auto_quote_enabled: boolean, fulfillment_mode: 'express'|'market', status: 'active'|'inactive', approval_status: 'pending'|'approved'|'rejected', supplier_internal_sku: string|null, supplier_notes: string|null, created_at, updated_at }`
- **ProductAdditionRequest**: `{ id, requested_by_user_id, supplier_company_id, proposed_name_en, proposed_name_ar, proposed_category_id, proposed_description, proposed_specs: Record<string,string>, sample_images: string[], reason_for_addition, estimated_demand: string|null, status: 'submitted'|'under_review'|'approved'|'rejected', admin_notes: string|null, resulting_master_product_id: string|null, rejection_reason: string|null, reviewed_by_admin_id: string|null, created_at, decided_at }`

### Lists and carts

- **FavouriteList**: `{ id, user_id, master_product_ids: string[] }`
- **CompanyCatalog**: `{ id, company_id, name, description, master_product_ids: string[], created_by_user_id }`
- **Cart**: `{ id, user_id, items: CartItem[], status: 'active'|'saved'|'expired', name?: string, expires_at?: string }`
- **CartItem**: `{ id, cart_id, master_product_id, qty, pack_type }`

### RFQ + quoting

- **RFQ**: `{ id, rfq_number, client_company_id, created_by_user_id, title, description, category_id?: string|null, delivery_city, delivery_date, status: 'draft'|'open'|'quoted'|'awarded'|'partially_awarded'|'cancelled', source: 'catalog'|'custom_request', items: RFQItem[], created_at, expires_at }`
- **RFQItem**: `{ id, rfq_id, master_product_id?: string|null, free_text_name?: string|null, description, qty, unit, pack_type?: string|null, specs_overrides?: string|null }`
- **Quote**: `{ id, quote_number, rfq_id, supplier_company_id, status: 'draft_auto'|'draft_manual'|'pending_supplier_send'|'pending_admin_review'|'submitted_to_client'|'accepted'|'partially_accepted'|'rejected'|'expired', is_auto_generated: boolean, supplier_review_window: 'instant'|'30min'|'2hr', supplier_reviewed_at: string|null, auto_send_at: string|null, admin_held: boolean, valid_until, lead_time_days, items: QuoteItem[], notes, submitted_at: string|null }`
- **QuoteItem**: `{ id, quote_id, rfq_item_id, offer_id?: string|null, supplier_unit_price_sar (server-only), final_unit_price_sar (server-only computed), qty_available, lead_time_days, notes, declined: boolean }`
- **QuoteLineSelection**: `{ id, rfq_id, quote_id, quote_item_id, client_user_id, selected_at }`

### Orders, deliveries, invoices

- **PO**: `{ id, po_number, type: 'CPO'|'SPO', transaction_ref, rfq_id?, source_quote_id?, source_quote_line_selections?: string[], client_company_id, supplier_company_id, status: 'draft'|'awaiting_approval'|'confirmed'|'in_transit'|'delivered'|'completed'|'cancelled', total_sar, items: POItem[], created_at }`
- **ApprovalTask**: `{ id, po_id, approver_user_id, status: 'pending'|'approved'|'rejected', order_in_chain, decided_at?, note? }`
- **DN**: `{ id, dn_number, spo_id, courier, tracking_number, dispatch_date, expected_delivery_date, items: DNItem[] }`
- **GRN**: `{ id, grn_number, cpo_id, dn_id, received_by_user_id, received_at, items: GRNItem[], notes }`
- **Invoice**: `{ id, invoice_number, cpo_id, grn_id, total_sar, vat_amount_sar, status: 'draft'|'issued'|'paid'|'overdue', issue_date, due_date, zatca_uuid?: string, zatca_qr?: string, payment_intent_id?: string }`

### Operations

- **Margin**: `{ id, scope: 'global'|'category'|'client', scope_id?: string, pct, updated_by_user_id, updated_at }`
- **Notification**: `{ id, user_id, type, title, body, read_at?, created_at, link? }`
- **AuditLog**: `{ id, actor_user_id, action, entity_type, entity_id, before?, after?, created_at }`
- **PlatformSettings**: `{ id, vat_rate, default_lead_time_days, rfq_expiry_days, auto_quote_admin_hold_threshold_sar, auto_quote_globally_enabled }`

## File: `packages/shared/src/validations/index.ts`

Export Zod schemas matching every type. Naming: `UserSchema`, `CreateRFQSchema`, `CreateQuoteSchema`, `CreateOfferSchema`, `CreateProductAdditionRequestSchema`, etc. Include create/update variants where useful.

## File: `packages/shared/src/utils/aliases.ts`

```ts
export function generateClientAlias(): string
// 'Client-' + 4 random alphanumeric upper, e.g. 'Client-A8B4'

export function generateSupplierAlias(takenAliases: string[]): string
// 'Supplier ' + colour from pool: Violet, Indigo, Teal, Amber, Coral,
// Sage, Rose, Slate. If pool exhausted, append number e.g.
// 'Supplier Violet 2'
```

## File: `packages/shared/src/utils/margins.ts`

```ts
export function applyMargin(supplier_cost: number, margin_pct: number): number
// supplier_cost * (1 + margin_pct / 100), rounded to 2 decimals

export function resolveMargin(margins: Margin[], category_id: string,
  client_company_id: string): number
// Resolution order: client > category > global
// SERVER ONLY. Never imported by client-facing components.
```

## File: `packages/shared/src/utils/numbers.ts`

```ts
export function generateDocNumber(
  prefix: 'CPO'|'SPO'|'DN'|'GRN'|'INV'|'RFQ'|'Q'): string
export function generateMasterProductCode(seq: number): string
// 'MWRD-PROD-' + 5-digit zero-padded
```

## File: `packages/shared/src/utils/zatca.ts`

```ts
export function generateZatcaTLV(invoice: Invoice, seller: Seller): string | null
// MVP: returns null. Phase 3: real TLV builder.
```

## File: `packages/shared/src/utils/three-way-match.ts`

```ts
export function matchPOGRNInvoice(po: PO, grn: GRN, invoice: Invoice):
  { matches: boolean, variance_pct: number, discrepancies: string[] }
// Tolerance: 2%
```

## File: `packages/shared/src/utils/payments.ts`

```ts
export function createPaymentIntent(invoiceId: string, amount: number,
  payment_method: string):
  Promise<{intent_id: string, status: string}>
// MVP: returns mock {intent_id: 'mock_'+uuid, status: 'requires_action'}
```

## File: `packages/shared/src/utils/approval-chain.ts`

```ts
export function computeApprovalChain(approvalNodes: ApprovalNode[],
  startUserId: string): string[]
// Walks tree from startUserId following direct_approver_user_id
// until null approver. Returns ordered list of approver user_ids.

export function detectCycle(approvalNodes: ApprovalNode[],
  proposedMemberId: string,
  proposedApproverId: string): boolean
// Returns true if setting proposedApproverId as direct approver of
// proposedMemberId would create a cycle.
```

## File: `packages/shared/src/utils/auto-quote.ts`

```ts
export function matchOffersToRFQ(rfq: RFQ, offers: Offer[]):
  Map<string, {
    matched_items: Array<{ rfq_item: RFQItem, offer: Offer }>,
    unmatched_rfq_items: RFQItem[]
  }>

export function generateAutoQuote(rfq: RFQ, supplierId: string,
  matchedItems, supplier: Company): Quote
// Builds Quote with status='draft_auto', is_auto_generated=true,
// computes auto_send_at based on supplier.auto_quote_review_window.

export function processAutoSendQueue(quotes: Quote[],
  now: Date, threshold_sar: number):
  { to_send_to_client: Quote[], to_hold_for_admin: Quote[] }
```

## File: `packages/shared/src/data/index.ts` (THE SWAP POINT)

This file exports the entire data API. Today: in-memory Maps. Tomorrow: Supabase calls. **Signatures NEVER change.**

Export these async functions (full list in the strategic brief; condensed groups here):

- **Auth (public)**: `registerPublic`, `markCallbackComplete`, `activateAccount`, `signIn`, `signOut`, `getCurrentUser`, `completeOnboarding`
- **Auth (backoffice)**: lives in `apps/backoffice/lib/auth.ts`, NOT in `@mwrd/shared`
- **Master catalog (read)**: `listCategories`, `listMasterProducts`, `getMasterProduct`
- **Master catalog (admin write)**: `createMasterProduct`, `updateMasterProduct`, `deprecateMasterProduct`, `createCategory`, `updateCategory`
- **Offers**: `listOffersForSupplier`, `getOffer`, `createOffer`, `updateOffer`, `toggleAutoQuote`, `pauseOffer`, `resumeOffer`, `approveOffer`, `rejectOffer`, `listOfferApprovalQueue`
- **Product Addition Requests**: `createProductAdditionRequest`, `listMyProductAdditionRequests`, `listAllProductAdditionRequests`, `approveProductAdditionRequest`, `rejectProductAdditionRequest`
- **Bundles**: `listBundles`, `getBundle`, `addBundleToCart`
- **Carts**: `getActiveCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `saveCart`, `listSavedCarts`, `resumeSavedCart`, `submitCartAsRFQ`
- **Catalogs**: `listCompanyCatalogs`, `createCompanyCatalog`, `addToCompanyCatalog`, `removeFromCompanyCatalog`, `renameCompanyCatalog`, `deleteCompanyCatalog`
- **Favourites**: `getFavourites`, `toggleFavourite`
- **RFQs**: `createRFQ`, `listRFQsForClient`, `listOpenRFQsForSupplier`, `getRFQ`
- **Quotes**: `listQuotesForSupplier`, `getQuote`, `editQuoteBeforeSend`, `sendQuoteNow`, `approveAdminHeldQuote`, `listQuotesForRFQ`
- **Awarding**: `acceptQuoteFullBasket`, `acceptQuotesPerLine`
- **Approvals**: `listMyApprovalTasks`, `approveOrder`, `rejectOrder`, `getApprovalChainStatus`
- **Account Management**: `listCompanyMembers`, `inviteCompanyMember`, `listCompanyRoles`, `createCompanyRole`, `assignRoleToMember`, `listApprovalNodes`, `setDirectApprover`, `listAddresses`, `createAddress`, `updateAddress`, `deleteAddress`
- **POs / DNs / GRNs / Invoices**: `listPOsForUser`, `getPO`, `createDN`, `createGRN`, `generateInvoice`, `recordPayment`
- **Backoffice**: `listLeadsQueue`, `listKycQueue`, `approveKYC`, `rejectKYC`, `listAllUsers`, `setMargin`, `getMargin`, `listAuditLog`, `listAdminHeldQuotes`, `listPendingAutoQuotes`
- **Notifications**: `listNotifications`, `markRead`, `sendNotification`

Anonymity rules apply on every read function: client-facing reads strip supplier `real_name`, supplier-facing reads strip client `real_name`. Backoffice reads return both.

## File: `packages/shared/src/data/seed.ts`

Seed in-memory store with EXACTLY these users:

**CLIENT**
- email: `client@mwrd.com`, password: `client123`
- role: `client`, real_name: `John Client`, phone: `+966500000001`
- platform_alias: `Client-A8B4`, status: `active`, activation_status: `activated`, onboarding_completed: `true`
- company: `{ real_name: 'Tech Solutions Ltd', vat_number: '...', cr_number: '...' }`

**SUPPLIER**
- email: `supplier@mwrd.com`, password: `supplier123`
- role: `supplier`, real_name: `Sarah Supplier`, phone: `+966500000002`
- platform_alias: `Supplier Indigo`, status: `active`, activation_status: `activated`, onboarding_completed: `true`
- company: `{ real_name: 'Acme Supplies Ltd', categories_served: [all 8], auto_quote_review_window: '30min' }`

**ADMIN**
- email: `admin@mwrd.com`, password: `admin123`
- role: `admin`, real_name: `Admin User`

### Additional seed data

- 8 categories (the canonical 8) with 2-3 subcategories each
- **200 master products** across the 3 strongest categories (Office Supplies, IT and Electronics, Furniture). Other 5 categories have 5–10 master products each as starter.
- **50+ Offers**: Sarah Supplier has offers on ~80% of master products with `auto_quote_enabled=true` on most. A second mock supplier ("Supplier Violet") has offers on ~30% of products with mixed `auto_quote_enabled`.
- **5 bundles**: CEO Office Pack (5 items), Kitchen Essentials (4), Cleaning Pack (3), Stationery Pack (6), New Office Pack (8)
- **4 RFQs** in various states: 1 draft, 1 open with auto-quotes pending, 1 quoted with multiple supplier responses, 1 awarded (split CPO)
- **6 quotes** (3 auto-generated, 3 manual)
- 2 confirmed CPOs with matching SPOs, 1 GRN, 1 invoice
- 3 product addition requests in various states
- 5 leads in callback queue
- Margins: global=15%, Electronics=12%, Furniture=20%, Industrial=18%, Footwear=15%, Accessories=25%
- PlatformSettings: `vat_rate=0.15`, `default_lead_time_days=7`, `rfq_expiry_days=7`, `auto_quote_admin_hold_threshold_sar=25000`, `auto_quote_globally_enabled=true`

## Verification

Write `packages/shared/test.ts` that:

- Imports `signIn` from `data/index.ts`, calls it with all 3 seed credentials, prints the user.
- Calls `listMasterProducts({})` and verifies count >= 200.
- Calls `registerPublic({...})` with mock data, verifies User is created with `status='pending_callback'` and no password set.
- Calls `markCallbackComplete`, verifies `activation_token` is generated.
- Calls `activateAccount` with the token, verifies user is activated.
- Submits a mock RFQ, verifies auto-quote engine creates draft quotes for matching suppliers.
- Calls `processAutoSendQueue` with `now=auto_send_at+1min`, verifies quotes route correctly (small ones to client, large ones to admin).
- **Includes a cycle-detection test** for `setDirectApprover`: build a chain A→B→C, attempt to set C's approver to A, assert it's rejected.

Run with: `npx tsx packages/shared/test.ts`. All checks must pass.
