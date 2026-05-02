# MWRD — Constitution

You are building MWRD, an anonymous B2B procurement platform for Saudi Arabia.

## What MWRD is

A managed marketplace where Saudi businesses (clients) source goods from
verified suppliers. Three client entry points:

1. **CATALOG RFQ**: client browses admin-curated master catalog (NO PRICES)
   and adds master products to an RFQ basket. Submits RFQ. System
   auto-quotes from supplier offers + adds margin server-side.
2. **CUSTOM REQUEST**: client describes off-catalog needs in free text.
   Suppliers manually quote.
3. **BUNDLES**: pre-built multi-item kits, one click to add all to RFQ.

MWRD applies a configurable margin to supplier quotes server-side,
coordinates logistics, and handles payments. Clients and suppliers
never see each other's real identities. Both sides see platform-
assigned aliases. Only backoffice sees real identities.

## Categories (8 top-level)

Office Supplies | IT & Electronics | Food & Beverages | Furniture |
Maintenance & Facility | Raw Materials | Corporate Gifts | Logistics & Fleet

## Apps (Turborepo monorepo)

- `apps/client`     → client.mwrd.io     (Next.js 15)
- `apps/supplier`   → supplier.mwrd.io   (Next.js 15)
- `apps/backoffice` → backoffice.mwrd.io (Next.js 15)
- `apps/mobile`     → iOS + Android (Expo, single codebase, public only)

## Tech stack (locked)

- Monorepo: Turborepo + npm workspaces
- Web: Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui
- Mobile: Expo SDK 51+, Expo Router, NativeWind, TypeScript strict
- State: TanStack Query (web + mobile)
- Forms: React Hook Form + Zod
- i18n: next-intl (web), expo-localization (mobile). EN + AR with RTL.
- PDFs: @react-pdf/renderer
- Backend: Supabase Bahrain region (wired in Phase 2, NOT NOW)
- Payments: **Moyasar** (abstracted, NOT WIRED in MVP)
- Invoicing: ZATCA Phase 2 (TLV stub, NOT SUBMITTED in MVP)

## Phase 1 rule (CRITICAL)

All data flows through `packages/shared/src/data/index.ts`. This is the
ONLY place that touches a "database". In Phase 1 it returns mock
in-memory data. In Phase 2 it will be replaced with Supabase calls.
NEVER bypass this layer. NEVER call `fetch()` or `supabase.from()` from a
component or page.

## Auth split rule (NEVER violate)

- `packages/auth-public` is shared between client + supplier + mobile only.
- `apps/backoffice` has its OWN separate auth code, never imports
  `packages/auth-public`.
- Public registration creates users with role IN `('client'|'supplier')`.
  Backoffice users (admin/ops/finance/cs) are created ONLY via the
  `/users/internal` page (superadmin only).
- Phase 2: Supabase Auth uses separate `aud` claims for public vs backoffice.
  Public token rejected by backoffice middleware. Backoffice token
  rejected by public middleware.
- Backoffice idle session timeout: 15 min. Public: 24 hours.

## Anonymity rules (NEVER violate)

- Client APIs and UIs: NEVER return supplier `real_name`. Use alias only.
- Supplier APIs and UIs: NEVER return client `real_name`. Use alias only.
- Backoffice: sees both real names.
- Aliases generated at registration via `packages/shared/src/utils/aliases.ts`
- Client alias format: `'Client-' + 4 alphanumeric upper` (e.g. `Client-A8B4`)
- Supplier alias format: `'Supplier ' + colour name from pool`
  (Violet, Indigo, Teal, Amber, Coral, Sage, Rose, Slate)
- Aliases never change.

## Supplier blind rules (NEVER violate)

- Suppliers see ONLY their own offers, quotes, orders.
- Master catalog browse on supplier side: NO "X other suppliers sell
  this" counter, NO competitor pricing signals, NO aggregate ranges.
- RFQ list on supplier side: shows only RFQs they were matched to,
  with NO indicator of how many other suppliers received the same RFQ.
- Quote rejection: supplier sees only "Quote not accepted". NO reason,
  NO comparison, NO winner identity.

## Quote-only client experience (NEVER violate)

- NO public prices anywhere on client UI. Period.
- Master catalog browse shows: name, image, specs, pack types. NEVER
  a price field.
- Bundle pages: NEVER show "From SAR X". Just product info.
- The ONLY place a client sees a price is in a quote received in
  response to an RFQ they submitted.

## Margin rules (NEVER violate)

- Suppliers submit cost prices in SAR via `Offer.pack_type_pricing`
- Margin is applied SERVER-SIDE in `packages/shared/src/utils/margins.ts`
- Client-facing API responses NEVER contain `margin_pct` or `supplier_cost`
- Supplier-facing API responses NEVER contain `final_price` or `margin`
- Margin resolution order: client > category > global
- Auto-quotes apply margin instantly UNLESS quote total > SAR 25,000
  (configurable threshold in `/settings`). Above threshold = hold for
  admin Quote Manager review.

## Master catalog rule (NEVER violate)

- `MasterProduct` entities are CREATED ONLY by admin (in backoffice).
- Suppliers do NOT create `MasterProducts`. Suppliers create `Offers`
  attached to existing `MasterProducts`.
- If a supplier wants to sell something not in the master catalog,
  they submit a `ProductAdditionRequest`. Admin reviews; if approved,
  admin creates the `MasterProduct`, supplier then creates the `Offer`.

## Document numbering

- CPO (Client PO):     `MWRD-CPO-YYYYMMDD-XXXX`
- SPO (Supplier PO):   `MWRD-SPO-YYYYMMDD-XXXX`
- DN (Delivery Note):  `MWRD-DN-YYYYMMDD-XXXX`
- GRN (Goods Receipt): `MWRD-GRN-YYYYMMDD-XXXX`
- INV (Invoice):       `MWRD-INV-YYYYMMDD-XXXX`
- MasterProduct code:  `MWRD-PROD-NNNNN` (5-digit padded sequence)
- RFQ:                 `MWRD-RFQ-YYYYMMDD-XXXX`
- Quote:               `MWRD-Q-YYYYMMDD-XXXX`
- Generators in `packages/shared/src/utils/numbers.ts`

## Three-way matching

PO × GRN × Invoice must match within 2% variance before invoice issues.
Discrepancy auto-holds the invoice and flags it to backoffice.

## Approval workflow (every order)

When a client member places an order:

1. CPO status → `'awaiting_approval'`
2. Compute approval chain from `ApprovalNode` tree (member's direct
   approver, then their approver, up to top of chain)
3. Create `ApprovalTask` for first approver, `status='pending'`
4. Each approver in turn: approve advances to next, reject sets
   order status to `'cancelled'`
5. Final approver approves → CPO `status='confirmed'`, SPO sent to
   supplier
6. Cycle detection: `setDirectApprover` MUST reject configurations
   where A approves B who eventually approves A.

## Auto-quote engine

When a client submits an RFQ:

1. For each RFQ item with a `master_product_id`:
   a. Find Offers where `master_product_id` matches AND
      `approval_status='approved'` AND `status='active'` AND
      `auto_quote_enabled=true`
   b. Group offers by `supplier_company_id`
2. For each supplier with at least one matching offer:
   a. Generate Quote with `status='draft_auto'`, `is_auto_generated=true`
   b. For each RFQ item: create `QuoteItem` from matching `Offer`
      (offer's `pack_type_pricing` for the requested `pack_type`)
   c. For RFQ items with NO matching offer for this supplier:
      skip (the supplier may add manually if they want)
   d. Compute `auto_send_at = now() + supplier.auto_quote_review_window`
   e. Notify supplier (`sendNotification` stub)
3. For suppliers in matching categories with NO matching offers:
   create Quote with `status='draft_manual'`. Supplier must build it
   manually. No `auto_send_at`.
4. When `auto_send_at` expires (background job in MVP: scheduled in
   simple `setTimeout` simulation), if status still `='draft_auto'`:
   a. Apply margin server-side
   b. If total > SAR 25,000: `status='pending_admin_review'`
   c. Else: `status='submitted_to_client'`, notify client

## Currency and VAT

- Currency: SAR everywhere (no USD)
- VAT rate: 0.15 (15% Saudi VAT) on every taxable item
- All prices and totals show price + VAT line item separately

## Non-negotiable code rules

- TypeScript strict mode. No `any`. No `@ts-ignore`.
- All API inputs validated with Zod before any logic
- All UI strings via `next-intl` (web) or `t()` (mobile). No hardcoded strings.
- All lists paginated, max 25 per page
- Use shadcn/ui on web, NativeWind on mobile. Don't reinvent UI.
- Soft deletes only (`deleted_at`). Never DELETE rows.
- Every entity has `created_at` and `updated_at`
- Use UUIDs for all IDs

## File creation rules

- One component per file
- Filename matches default export
- No barrel files except `packages/shared/src/types/index.ts`
- Server actions live in `app/actions/<entity>.ts`

## When you don't know

Ask. Do not invent table names, column names, or API endpoints.
The data contract is in `packages/shared/src/types/` — read it first.

## What NOT to build in Phase 1

- Real Supabase connection
- Real Moyasar API calls
- Real ZATCA Fatoora submission
- Real email or SMS sending (use `console.log`)
- File uploads to cloud storage (use base64 in mock data)
- Push notifications (stub the function)

## What's deferred to v2 (do not build)

- Wallet and Transaction History
- Reports module
- Subscriptions
- Company Contracts
- Analytics Tags
- Bulk Orders
- Customer Service ticketing
- Tiered pricing (qty break-points)
- Tag-based fuzzy matching for auto-quote
- CSV bulk upload for offers
- Aggregate competitor pricing signals
- Client-driven product addition requests
- Supplier ratings
- 2FA
