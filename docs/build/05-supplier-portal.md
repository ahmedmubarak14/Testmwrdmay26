# Prompt 5 — Supplier portal (supplier.mwrd.io)

> **Recommendation:** split into sub-prompts: (a) auth + dashboard + master catalog browse with `[Sell This]`, (b) rate card + product addition requests, (c) RFQs + quote builder + orders + DN. Verify each before continuing.

---

Build the supplier portal at `apps/supplier`. Reads from `@mwrd/shared/data`. Imports auth from `@mwrd/auth-public`. Anonymity rules: client `real_name` NEVER shown. **Supplier blind rules: NO competitor data of any kind.**

## Layout

**Sidebar:**

- Header: mwrd logo + "Supplier Portal" subtitle, search input below
- **MAIN**
  - Dashboard
  - Browse Master Catalog
  - My Rate Card
  - RFQ Requests
  - My Quotes
  - Orders
- **MANAGEMENT**
  - Product Addition Requests
- **ACCOUNT**
  - Settings
  - Help
- Footer: AR/EN toggle, user card + logout

**Topbar:** search, notification bell, chat icon, avatar.

## Auth pages

Mount `@mwrd/auth-public` components at `/login`, `/register`, `/register/thank-you`, `/activate`, `/onboarding`.

## `/dashboard`

- Heading "Dashboard" + "Welcome back, [first_name]."
- Welcome toast top-right on first load (auto-dismiss 4s).
- Three big stat cards:
  1. New RFQ Matches (count, orange) → `/rfqs`
  2. Quotes Submitted (count, dark) → `/quotes`
  3. Active Offers (count, dark) → `/rate-card`
- Below: "Pending Actions" table. Columns: RFQ ID, Auto-Quote Status ("Auto-draft pending review until [HH:MM]" / "Manual quote needed"), Items count, Action (`[Review & Send]` / `[Submit Quote]`).

**CRITICAL: NO "how many other suppliers" indicator anywhere.**

## `/catalog` (Master Catalog browse, supplier view)

- Same master catalog the client sees, but each card has:
  - `[Sell this Product]` CTA if no offer yet
  - `[Edit Offer]` if already selling (pulls from offers list)
- Filters: category, subcategory, search, "My Offers Only" toggle

**CRITICAL: NO "X suppliers sell this" counter. NO competitor pricing signals.**

## `/catalog/products/[id]` (Master Product detail, supplier view)

- Read-only product info: image gallery, name, specs, pack types.
- Below: "Sell This Product" panel.
  - If no offer exists: form to create one
  - If offer exists: form pre-filled with current offer values
- Form fields:
  - Pack Type Pricing (repeater, one row per `pack_type` from master):
    - Pack Type (from master, locked)
    - Cost Price (SAR)
    - Min Order Qty
  - Default Lead Time (days)
  - Available Quantity Estimate (optional, for stock signals)
  - Fulfillment Mode (Express / Market radio)
  - Supplier Internal SKU (optional)
  - Supplier Notes (optional)
  - Auto-Quote Toggle
- `[Save Offer]` (sets `approval_status='pending'` on first creation).
- On approval pending: banner "Your offer is awaiting admin approval before it's matched to RFQs."

## `/rate-card` (My Rate Card)

- Heading "My Rate Card" + "Your active product offers and pricing."
- Top right: `[Rate Card Settings]` → `/rate-card/settings`.
- Filters: Category, Status (Active/Inactive/Pending), Auto-Quote (On/Off).
- Table:
  - Master Product (image + name + `master_product_code`)
  - Pack Type Pricing (compact display, e.g. "Each: SAR 5 | Box of 12: SAR 50 +1")
  - Lead Time
  - Auto-Quote (inline toggle)
  - Status (Active / Inactive / Pending Approval / Rejected)
  - Actions: `[Edit]` `[Pause/Resume]` `[Delete]` kebab
- Bulk actions: "Toggle auto-quote on/off for selected".
- Empty state: "No offers yet. Browse the master catalog to add products you sell." `[Browse Master Catalog]`.

## `/rate-card/settings`

- Heading "Rate Card Settings".
- Field: Auto-Quote Review Window — radio:
  - Instant (auto-send to MWRD as soon as RFQ matches)
  - 30 minutes (default — hold for review, auto-send if no action)
  - 2 hours (longer review window)
- Field: Auto-Quote Globally Enabled (toggle, default ON)
  - Subtext: "Master kill switch. Turn off to disable auto-quotes for all your offers without changing per-offer toggles."
- Field: Default Lead Time Pad (days, default 0)
  - Subtext: "Automatically add this many days to all your offers' lead times. Useful during high-demand periods."
- `[Save]`.

## `/product-requests`

- Heading "Product Addition Requests" + "Request additions to the master catalog."
- Top right: `[+ Submit New Request]`.
- Table: Proposed Name, Category, Submitted Date, Status (Submitted / Under Review / Approved / Rejected).
- On approved: "Now available, `[Create Offer]`" link in actions.
- On rejected: `[View reason]` expandable.

## `/product-requests/new`

- Heading "Submit a Product Addition Request" + "Tell us about a product you'd like to sell that's not yet in our catalog."
- Form (single page):
  - Proposed Product Name (English)
  - Proposed Product Name (Arabic)
  - Category (dropdown)
  - Description
  - Specs (key-value repeater)
  - Sample Images (up to 4, mock base64 in MVP)
  - Reason for Addition (textarea: "Why should MWRD add this product?")
  - Estimated Demand (optional)
- `[Submit Request]`. Toast: "Request submitted. We'll review and get back to you within 3 business days."

## `/rfqs` (Received RFQs)

- Heading "RFQ Requests".
- Two main filters: All | Auto-Drafts Pending | Manual Quote Needed
- Table:
  - RFQ ID
  - Date Received
  - Items (count + brief "item names" tooltip)
  - Match Type ("All items match your rate card" / "N of M items match" / "Custom request — manual quote needed")
  - Auto-Draft Status ("Draft ready, auto-sends in HH:MM" / "No auto-quote" / "Sent to client at HH:MM")
  - Action: `[Review & Send]` for auto-drafts pending review, `[Submit Quote]` for manual, `[View]` for already sent

**CRITICAL: NO indication of how many other suppliers got the same RFQ. Client identity NEVER shown beyond alias.**

## `/rfqs/[id]/quote` (Submit/Edit Quote)

- Heading "Quote for RFQ-XXXX".
- Top banner conditional:
  - If `is_auto_generated` and `status='draft_auto'`: "Auto-quote drafted from your rate card. Will send automatically at [HH:MM] unless you edit and confirm."
  - If `status='draft_manual'`: "No matching offers found in your rate card. Please quote manually for the items you can fulfill."
- Two-column layout.

**LEFT: Quote Details** — items list. Each item card:

- Master product image + name + qty + `pack_type`
- Form fields per item:
  - Unit Price (SAR) — pre-filled from offer if matched
  - Lead Time (days) — pre-filled from offer if matched
  - Qty Available
  - Item Notes (optional)
  - `[Decline this line]` checkbox (greys out the row)

**RIGHT (sticky): Quote Summary** — Subtotal, Shipping (manual entry), Tax (15% auto), Total.

- Notes (textarea, applies to whole quote)
- Valid Until (date picker, default +14 days)
- `[Send Quote Now]` (primary)
- `[Save Draft]` (only for manual, not auto)
- Info banner: "Your quote will be reviewed by the admin before being sent to the client."

Submit calls `editQuoteBeforeSend` then `sendQuoteNow`.

## `/quotes` (My Quotes)

- Heading "My Quotes".
- Filters: Status (Draft Auto / Draft Manual / Pending Admin Review / Submitted / Accepted / Partially Accepted / Rejected / Expired).
- Table: Quote ID, RFQ Ref, Submitted Date, Total, Status, View.
- On "Rejected": supplier sees "Quote not accepted" — **NO reason, NO comparison, NO winner identity.**

## `/quotes/[id]`

Quote detail view-only after submit. Items, totals, status timeline.

## `/orders`

- Heading "Orders Management" + `[+ New Order]` (top right, edge case).
- Three tabs: Won Purchase Orders | Completed Orders | Pending Orders.
- Each tab: subtext "Client names are anonymized for privacy."
- Search by Order ID/Client + Status dropdown + Date Range.
- Table: checkbox, Order ID (#PO-XXXXX), Client (Client-A8B4), Items/Quantity, Acceptance Date, Status, View Details.
- Pagination: "Showing 1-3 of N".

## `/orders/[id]`

- SPO details: `po_number`, status, `transaction_ref`, items table, client by alias only, delivery city only (NOT full address with client name).
- If `status='confirmed'`: `[Create Delivery Note]`.

## `/orders/[id]/dn`

- Form: Courier (dropdown), Tracking Number, Dispatch Date, Expected Delivery Date.
- Items repeater: per-item `qty_dispatched`, notes.
- Submit → `createDN()`. Status moves to `in_transit`.

## `/settings`

- Profile Picture upload.
- Company Information form.
- Notification Preferences toggles (New RFQ Alerts, Order Updates, Payment Notifications).
- Security Settings.

## Verification

- Sign in as `supplier@mwrd.com`.
- Browse master catalog at `/catalog`. Pick a master product, click `[Sell this Product]`. Fill offer form with auto-quote ON. Submit.
- Verify offer appears in `/rate-card` with `status='pending approval'`.
- (Skip backoffice approval for now — wire-up in Prompt 6.)
- Submit a Product Addition Request via `/product-requests/new`.
- Verify it appears in `/product-requests` with `status='submitted'`.
- Sign in as client (different browser), submit an RFQ for products the supplier has approved offers on with auto-quote ON.
- Sign back in as supplier, see RFQ in `/rfqs` with auto-draft pending.
- Open the auto-draft in `/rfqs/[id]/quote` — see pre-filled prices.
- Edit one line price, decline another, click Send Now.
- Verify quote moves through pipeline (admin review if total >25k, else direct to client).
- Verify quote rejection (when client picks another supplier) shows ONLY "Quote not accepted" — no reason, no winner.
- **Verify NO `real_name` leaks anywhere in supplier UI.**
- **Verify NO competitor pricing or supplier-count indicators visible.**
