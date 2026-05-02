# Prompt 4 — Client portal (client.mwrd.io)

> **Recommendation:** this prompt is large. Run it in three sub-prompts: (a) auth + dashboard + catalog browse, (b) RFQ + cart + comparison, (c) account management + settings. Verify each before continuing.

---

Build the client portal at `apps/client`. Reads from `@mwrd/shared/data`. Imports auth pages from `@mwrd/auth-public`. Anonymity rules apply throughout. **Quote-only client experience: NO PUBLIC PRICES anywhere.**

## Layout

`AppShell` with collapsible left sidebar + topbar.

**Sidebar** (mwrd logo + "Client Portal" subtitle, search input below):

- **MAIN**
  - Dashboard
  - Browse Catalog
  - RFQs
  - Orders
- **MANAGEMENT**
  - Saved Carts
  - Favourite List
  - Company Catalogs
  - Bundles
- **ACCOUNT**
  - Account Management
  - Settings
  - Help
- Footer: AR/EN toggle, user card with avatar + name + email + logout

**Topbar:** global search (master catalog), notification bell with badge, chat icon, user avatar.

## Auth pages

Mount `@mwrd/auth-public` components at `/login`, `/register`, `/register/thank-you`, `/activate`, `/onboarding` (per Prompt 3).

## `/dashboard`

Heading "Dashboard" + "Welcome back, [first_name]".

Three big action cards in a row:

1. Create New RFQ (primary, blue) → `/rfqs/new`
2. View Pending Quotes (count badge) → `/rfqs?status=quoted`
3. Track Orders (count badge) → `/orders`

Below: two-column layout

- Left: Recent RFQs (last 3) with View All link, status badges
- Right: Quotes Received (last 4) showing "For RFQ-X, from Supplier Violet, SAR 1,320.00, View Quote"

Below that: Order History full-width table with last 5 orders.

## `/catalog` (Browse Master Catalog)

- Top: Express vs Marketplace toggle pills. Express filters offers with `fulfillment_mode='express'`.
- Categories grid (8 categories from seed) with icons.
- Best Sellers strip (horizontal scroll, master products with most active offers — proxy for popularity).
- Bundles strip (horizontal scroll, links to `/bundles`).
- Search input top-right.

## `/catalog/categories/[slug]`

- Heading "Master Catalog: [Category Name]" + breadcrumb.
- Left filter sidebar:
  - Subcategory (children of this category)
  - Pack types (multi-select)
  - Spec filters (dynamic based on category — e.g., for chairs: material; for paper: gsm)
  - Brand (placeholder for v2 — show as "Coming soon")
  - "Clear all" link top right of filters
- Right: search input + sort dropdown (Newest / Most Popular)
- Product grid (3 cols), each card:
  - Image, Title (from `MasterProduct.name_en` or `name_ar` based on locale), `master_product_code`
  - Brief specs (top 2 spec key-values)
  - Express or Market badge if any active offer has that fulfillment mode (compute server-side, do not show price)
  - `[Add to RFQ]` button

**CRITICAL: NO PRICE FIELD ANYWHERE. NO "From SAR X".**

## `/catalog/products/[id]` (Master Product Detail)

- Breadcrumb: Home / Category / Product Name
- Two-column: image gallery (with thumbnails strip) | info panel
  - Category tag above title
  - Title h1, `master_product_code`
  - Express or Market badge
  - Full specs table
  - Pack Type dropdown (from `master_product.pack_types`)
  - Quantity stepper (- N +)
  - Three CTAs in 2 rows:
    - Row 1: `[Favourite List]` `[Add to Catalog]`
    - Row 2: `[Add to RFQ]` (full width primary)

**CRITICAL: NO PRICE. NO "available from N suppliers".**

## `/catalog/bundles`

Grid of bundles. Each card: image, name, "5 items", `[View Bundle]`. **NO "From SAR X".**

## `/catalog/bundles/[slug]`

- Hero with bundle image (left) and dark teal title card (right).
- Items table: Product (image + name + `master_product_code` + Pack Type), Default Qty, `[Edit qty]`.
- Single CTA: `[Add Bundle to RFQ]` (blue, full width).
- Optional: `[Download Spec Sheet PDF]` (lists items + specs, NO PRICES).

## `/cart` (RFQ basket)

- Heading "Your RFQ Basket".
- Items table: Product (image + name + code), Pack Type, Quantity stepper, `[Remove]`.
- **NO PRICE COLUMN.**
- Empty state: "Your basket is empty. Browse catalog or submit a custom request."
- Bottom buttons: `[Continue Browsing]` `[Save for Later (saves cart with name and 7-day expiry)]` `[Submit RFQ]` (primary)

## `/rfqs/new` (RFQ submission)

Form fields: Title (required), Delivery City, Required Delivery Date, Description / additional context (textarea).
Items section: read-only display of cart contents (master products).
`[Submit RFQ]` → calls `submitCartAsRFQ()`. Toast: "RFQ-XXXX submitted. Suppliers will be notified." Redirect to `/rfqs/[id]`.

## `/rfqs/new/custom` (Custom Request)

- Heading "Submit a Custom Request".
- Subtext: "For items not in our catalog. Tell us what you need; we'll source quotes from suppliers in our network."
- Multi-step form (or single page with grouped sections):
  1. Basics: title, category dropdown, description (textarea), delivery city, delivery date
  2. Items (repeater): Item Name, Description, Qty, Unit, Specs (key-value repeater)
  3. Review and submit
- Submit calls `createRFQ(userId, input, 'custom_request')`. Toast: "Custom Request submitted. RFQ-XXXX created." Redirect to `/rfqs/[id]`.

## `/cart/saved`

- Heading "Saved RFQ Baskets".
- Empty state: icon + "No saved baskets. Create one from your active basket. Note: baskets expire 7 working days from creation."
- Non-empty: list of saved baskets as cards (name, item count, "Expires in X days", `[Resume]` `[Submit as RFQ]` `[Delete]`).

## `/rfqs`

- Heading "Request History" + subtext "Track the status of your RFQs and review incoming quotes."
- Top right: `[Export CSV]` `[+ New Request]` (with dropdown: Catalog RFQ / Custom Request).
- Table columns: RFQ Details (#R + title), Date, Items count, Status (Pending / Quoted / Awarded / Partially Awarded / Closed), Action.
- Action column shows:
  - "Awaiting Suppliers" if Pending
  - `[Review Quotes]` (blue) if Quoted, with subtext "N quotes received"
  - `[View Award]` if Awarded or Partially Awarded

## `/rfqs/[id]`

RFQ detail header: number, title, status, submission date, quotes received count, `expires_at` countdown.

**Tabs:** Details | Quotes Received.

- **Details tab:** items list, delivery info, original description.
- **Quotes Received tab:** button `[Compare Line by Line]` (primary) → `/rfqs/[id]/compare`. Below: list of supplier quote summary cards (Supplier alias + star rating placeholder + total + lead time + `[View Full Quote]`).

## `/rfqs/[id]/compare` (THE LINE-ITEM COMPARISON VIEW)

- Heading "Compare Quotes for RFQ-XXXX".
- Sort dropdown: "Best Price" / "Fastest Delivery" / "Best Value".
- Filter: "Only show suppliers who can deliver by [delivery_date]" (toggle).

**Matrix table:**

- Header row: Item | Supplier Alias 1 (★4.8) | Supplier Alias 2 (★4.5) | ...
- Data rows: one per RFQ item. Each cell:
  - Final Price (margin-applied), small "per unit"
  - Lead time (color-coded: green if ≤ `delivery_date`, amber if borderline, red if too late)
  - `[Select]` checkbox (green if selected)
  - "Out of Stock" or "Declined" if supplier declined this line

**Sticky footer:**

- Selected per supplier: aliases + total per supplier
- Grand Total: SAR XX,XXX
- Two CTAs:
  - `[Confirm Per-Item Award (creates split CPOs)]` (primary)
  - `[Award Entire RFQ to one supplier]` dropdown to choose supplier

**Confirm per-item award:**

- Calls `acceptQuotesPerLine()` with selections array.
- Generates split CPOs (one per supplier).
- Each CPO enters approval chain.
- Toast "N orders submitted for approval". Redirect to `/orders`.

**Award entire RFQ:**

- Calls `acceptQuoteFullBasket()`.
- Single CPO enters approval chain.
- Toast "Order submitted for approval." Redirect to `/orders`.

## `/orders`

- Heading "Order Management".
- Tabs: Orders | Waiting Approval (with internal sub-tabs: All / My Approval / Approved / Rejected).
- Top right: `[Export]`.
- Orders table: Order ID + "Purchase Order" subtitle, Date, Items (Multiple Items pill if >1), Amount, Status (In Transit / Awaiting Confirmation / Pending Payment / Delivered / Cancelled), View Details.
- Waiting Approval table: Order Number, Order Date, Created by, Amount, Order Status, Current WF Approver.

## `/orders/[id]`

- CPO header: `po_number`, status, `transaction_ref`.
- Status timeline (Confirmed → Awaiting Approval → Approved → In Transit → Delivered → Completed).
- Items table.
- If `awaiting_approval` and current user is the approver: `[Approve]` `[Reject with note]` buttons.
- If `status='in_transit'`: `[Confirm Receipt]` → opens GRN form (per-item `qty_received`, condition radio: ok/damaged/short, notes).
- Supplier shown by alias only. **Anonymity rules apply.**

## `/favourites`

Simple grid of favourited master products with `[Remove]` `[Add to RFQ]` per card. **NO PRICES.**

## `/catalogs`

- List of company catalogs as cards: name, description, item count, `[View]` `[Rename]` `[Delete]`.
- `[+ Create New Catalog]`.
- Drawer view: list of master products in catalog, `[Remove from catalog]` per row, `[Add Products]` (opens master catalog picker).

## `/account/users`

- Top tabs: Users | Roles | User Group | Billing Details | Addresses | Approval Tree.
- Users tab: table with Assigned User, Email, Number, Company Roles. Per-row actions menu (kebab). Top right: `[+ Invite User]` → dialog (email, role dropdown).

## `/account/roles`

- `[+ Add New Role]` top right.
- Each role as a card: name, "N Users" with `[View All]` link, `[Assign User]` button, kebab menu.

## `/account/approval-tree`

- Table: Assigned User | Direct Approver | Chain
- Each row: user name, `[Choose Approver]` (opens picker).
- Chain column shows visualization of full chain via `approval-chain` util.
- **Cycle detection:** `setDirectApprover` throws if cycle would form. Show error toast: "This would create an approval cycle. Choose a different approver."

## `/account/addresses`

- Sub-tabs: Delivery Addresses | Billing Addresses.
- `[+ Add Delivery/Billing Address]` button per tab.
- Address cards show: label, full address + phone, National Code, Address Code (copyable), delete icon.

## `/settings`

Profile picture, Company Information form (read-only fields shown which were captured at onboarding), Notification Preferences toggles, Security Settings (Current/New password).

## Verification

- Sign in as `client@mwrd.com` → sees client portal dashboard.
- Browse `/catalog` → **NO PRICES visible anywhere.** Master products show name, image, specs only.
- Add 3 master products to cart, click Submit RFQ, fill meta form, submit → RFQ-XXXX created, suppliers notified, auto-quote engine fires (verify in `console.log`).
- After auto-quote settle period (or manually trigger by setting `auto_send_at` to past), reload `/rfqs/[id]` → see quotes received.
- Click "Compare Line by Line" → matrix view rendered. Click `[Select]` for different suppliers per line, click "Confirm Per-Item Award" → verify split CPOs created (count = unique suppliers selected).
- Verify each CPO enters `/orders` Waiting Approval with correct Current WF Approver.
- **Verify NO `real_name` leaks anywhere in client UI.**
- Submit a Custom Request via `/rfqs/new/custom` — verify it shows up with `source='custom_request'` and only manual quote suppliers (no auto-quote attempted).
- Save a cart, verify it appears in `/cart/saved` with 7-day expiry.
- Bundle: add a bundle to RFQ basket, verify all items appear.
