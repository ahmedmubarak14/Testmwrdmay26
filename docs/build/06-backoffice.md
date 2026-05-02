# Prompt 6 — Backoffice (separate auth, separate everything)

This is the platform's nerve center. It has its own auth, its own session policies, and its own user-creation flow. **It NEVER shares auth code with public apps.**

> **Recommendation:** split into sub-prompts: (a) separate auth + middleware + dashboard + leads/KYC, (b) master catalog + product requests + offer approvals, (c) quote manager + three-way match + logistics, (d) users management + audit log + settings.

---

Build the backoffice at `apps/backoffice`. Reads from `@mwrd/shared/data`. **Has its OWN auth implementation in `apps/backoffice/lib/auth.ts`. DOES NOT import from `@mwrd/auth-public`. This is intentional and non-negotiable.**

## Auth (separate from public)

### `apps/backoffice/lib/auth.ts`

```ts
export async function signInBackoffice(email, password)
// Validates credentials. Verifies user.role IN
// ('admin','ops','finance','cs'). Returns session token.
// 15-minute idle timeout (vs 24-hour for public).

export async function getBackofficeSession(token)
// Verifies token. Verifies role still in backoffice set.
// Returns user or null.

export async function inviteInternalUser(email, name, role, actorSuperadminId)
// Creates User with status='pending_kyc' (we skip callback for
// internal users — superadmin invitation IS verification).
// Generates activation_token. Calls sendNotification with internal
// activation link (different from public — points to /internal/activate).

export async function activateInternalUser(token, password)
// Sets password, status='active', activation_status='activated'.
```

### `apps/backoffice/middleware.ts`

- Reads `mwrd_session_backoffice` cookie (**DIFFERENT NAME from public**)
- If absent and route !in (`/login`, `/internal/activate`): redirect to `/login`
- Verifies session via `getBackofficeSession()`
- If `user.role NOT in (admin/ops/finance/cs)`: clear cookie, redirect to `/login` with error "This portal is for internal users only."
- Idle timeout enforced: if `session.last_seen < now - 15min`, invalidate.

### `apps/backoffice/app/login/page.tsx`

- Custom `LoginForm` (NOT shared with public)
- Header: "MWRD Backoffice"
- Body: email + password fields, `[Sign in]`
- Footer: "Forgot password? Contact your superadmin."
- **NO "Register" link** (no public registration)
- **NO links to other portals**

### `apps/backoffice/app/internal/activate/page.tsx`

- Token-gated. Reads `?token` query param.
- Validates token via `getCurrentUserByToken` (filters role to internal set).
- Password creation form.
- On success: clears `mwrd_session_public` if present, sets `mwrd_session_backoffice`. Redirects to `/dashboard`.

## Layout

`AppShell` with collapsible left sidebar + topbar.

**Sidebar:**

- Header: mwrd logo + "Admin Portal" subtitle
- Search input below
- **ONBOARDING**
  - Leads (callback queue, badge with count)
  - KYC (post-callback, badge with count)
- **CATALOG**
  - Master Catalog
  - Product Requests (badge with count)
  - Offer Approvals (badge with count)
- **OPERATIONS**
  - Quote Manager
  - Three-Way Match (badge with count)
  - Logistics
- **USERS**
  - Clients
  - Suppliers
  - Internal Users (visible only to superadmin)
- **ANALYTICS**
  - Overview
  - Audit Log (visible only to superadmin)
- **ACCOUNT**
  - Settings
  - Help
- Footer: AR/EN toggle, user card with name/email + logout

**Topbar:** search, notification bell, avatar.
**Banner:** yellow strip "Backoffice Mode — actions are audited".

## `/dashboard`

- Heading "Dashboard" + "Overview of platform performance."
- Top right: Last 30 Days dropdown + "Custom Range" link.
- Three KPI tiles:
  - Total Sales: SAR 348,920 with delta "+12% vs last month" + sparkline
  - Average Margin: 18.2% with delta "+0.5% vs last month" + sparkline
  - Total Orders: 1,247 with delta "+8% vs last month" + sparkline
- Two-column row:
  - Left: "Revenue Breakdown" bar+line chart (Sales bars + Margin line by month, last 6 months)
  - Right: "Pending Actions" panel with grouped items, each clickable
- Below: "Recent Orders" full-width table (last 10 across platform).

## `/leads` (Callback Queue)

- Heading "Lead Management — Callback Queue".
- Subtext: "Newly registered users awaiting verification call. Status flips to KYC after callback completes."
- Filters: Account Type, Date submitted, Status.
- Table: Submitted At, Name (`real_name`), Phone, Account Type, Company Name (`real_name`), Status, Action.
- Per-row `[View]` → drawer with full registration data and:
  - Form: Notes (textarea, free text from callback)
  - Buttons: `[Mark Callback Complete]` `[Mark Callback Failed (defer)]`
- **Mark Callback Complete:**
  - Calls `markCallbackComplete(userId, notes, actorAdminId)`
  - Generates `activation_token`, sends activation email (`console.log` link)
  - Moves user to `/kyc` queue
  - Audit-logged.

## `/kyc` (KYC Verification Queue)

- Heading "KYC Verification Queue".
- Subtext: "Users who've activated and uploaded KYC documents."
- Table: Activated At, Name, Account Type, Company, KYC Documents count, Status, Action.
- Per-row `[Review]` → drawer:
  - KYC document viewer
  - Buttons: `[Approve KYC]` `[Request More Docs]` `[Reject]`
- Approve KYC: `status='active'`. User can now use platform fully.
- Reject: `status='suspended'`, notify with reason.

## `/master-catalog`

- Heading "Master Catalog Management".
- Tabs: Categories | Master Products.

**Categories tab:** Tree view (parent categories with children indented), `[+ Add Category]` (top right), per-row `[Edit]` `[Deprecate]` kebab.

**Master Products tab:** Filters (Category, Status, Search). Top right: `[+ Add Master Product]` `[Bulk Import (CSV)]` (CSV stubbed). Table: `master_product_code`, Name, Category, # Active Offers, Status, Created At, Actions. Per-row `[Edit]` and `[Deprecate]` (with confirmation).

## `/master-catalog/products/new` and `/master-catalog/products/[id]/edit`

Form (single page, sectioned):

1. **Basics**: Name (en/ar required), Description (en/ar), Category (dropdown, required)
2. **Specs**: Specs (key-value repeater)
3. **Images**: Images (upload, up to 6, mock base64), `[Set as primary]` per image
4. **Pack Types**: Pack Types (multi-select with custom add), Default Unit

`[Save]` → calls `createMasterProduct()` (admin write). Edit form shows # active offers (read-only) and `[Deprecate]` button.

## `/product-requests`

- Heading "Product Addition Requests".
- Subtext: "Supplier proposals for new master products."
- Filters: Status, Category, Supplier.
- Table: Submitted At, Proposed Name (en), Submitted By (supplier `real_name`), Category, Status, Action.
- Per-row `[Review]` → drawer with:
  - Full request details
  - Two main actions:
    - `[Approve and Create Master Product]` → opens form pre-filled from request. Admin can edit any field before saving. On save: creates `MasterProduct`, sets `request.status='approved'`, `request.resulting_master_product_id`, notifies supplier.
    - `[Reject]` → dialog with reason textarea. Sets `status='rejected'`, stores `rejection_reason`, notifies supplier.

All actions audit-logged.

## `/offer-approvals`

- Heading "Offer Approvals".
- Subtext: "New supplier offers awaiting admin verification."
- Filters: Supplier, Category, Submitted Date, Status.
- Top: `[Bulk Reject]` `[Bulk Approve]`.
- Table: Checkbox, Master Product (image + name + code), Supplier (`real_name` + company `real_name`), Cost Price (range across pack types), Lead Time, Submitted Date, Status, Per-row icons `[Info yellow]` `[Reject red]` `[Approve green]`.
- Approve: `approval_status='approved'`, `status='active'`.
- Reject: `approval_status='rejected'`, dialog for reason.
- Approved offers immediately available for auto-quote matching.
- Audit-logged.

## `/quote-manager` (THE central operations page)

Heading "Quote Manager".

**TOP CARD: "Global Margin Configuration"**

Two-column layout:

- Left: "Universal Margin" card. Single % input + `[Save]`. Subtext: "Default margin applied to all quotes when no category-specific margin is set."
- Right: "Category Margins" grid. Each category as a tile: name + margin % (editable inline) + `[Save]`. `[+ Add Category]` tile.

Margin actions call `setMargin()` — audit-logged.

**MIDDLE CARD: "Quotes Pending Review"**

Description: "Auto-quotes flagged for admin review (above SAR 25,000 threshold) and manual quotes from suppliers."

Each quote as expandable card:

- Card header: Quote ID + RFQ Ref + category pill + status pill + "Submitted [HH:MM]" + dropdown arrow
- Card body (3 columns):
  - **LEFT:** "From Supplier" (`real_name` + company) → "To Client" (`real_name` + company). Items list with cost prices and lead times.
  - **MIDDLE:** Margin slider. Cost Price (large), Lead Time, Margin: `[-] N% [+]` (slider with manual override input). CATEGORY pill if currently using category default. OVERRIDDEN pill if admin has manually set this quote's margin.
  - **RIGHT:** "Final Client Price" (huge, green). Profit calc (Cost × Qty × Margin% = SAR profit). `[Send to Client]` (commits and routes).
- Margin slider live-updates final price (reactive).

**BOTTOM CARD: "Pending Auto-Quotes" (health monitor)**

Subtext: "View-only. Auto-quotes still in supplier review window. Will route automatically once window expires."
Compact table: RFQ Ref, Supplier, Total, Auto-send at HH:MM, Status.

## `/three-way-match`

- Heading "Three-Way Match Review".
- Subtext: "Invoices on hold due to PO/GRN/Invoice variance >2%."
- Filters: Variance %, Date.
- Table: Invoice ID, CPO Ref, GRN Ref, Variance %, Issue Date, Action.
- Per-row `[Review]` → drawer:
  - Side-by-side comparison: PO totals | GRN totals | Invoice totals
  - Highlighted discrepancies (red on cells with >2% variance)
  - Buttons: `[Override + Approve]` (with reason) | `[Reject + Return to Supplier]`
- All actions audit-logged.

## `/logistics`

- Heading "Logistics Oversight".
- Tabs: In Transit | Delayed | Delivered Last 7 Days.
- Table: SPO ID, Supplier, Client (alias), Courier, Tracking, Dispatch Date, Expected Delivery, Status.
- Per-row `[View]` → drawer with full DN.
- Bulk action: `[Mark as Delivered]` for selected rows.
- Per-row `[Mark Exception]` (delay/loss/damage) → dialog with reason.

## `/users/clients`

- Heading "Client Management".
- Top: search input + Status dropdown + Date range + `[+ Add Client]` + `[Bulk Actions]` dropdown.
- Table: Checkbox, Client Name (`real_name`), Company (`real_name`), Email, Status, Date Joined, Kebab menu.
- Per-row `[View]` → drawer (NOT modal):
  - Profile section: `real_name`, real company name, alias
  - KYC docs viewer
  - Company members list
  - Activity log
  - `[Suspend]` (confirmation dialog) → `status='suspended'`
  - `[Reactivate]` (if suspended)
  - All actions audit-logged.

## `/users/suppliers`

Same pattern as Clients. Extra column: KYC Status. Extra status values: Approved / Pending / Rejected / Requires Attention.

## `/users/internal` (superadmin only)

- Heading "Internal Users".
- Subtext: "MWRD team members with backoffice access."
- Top right: `[+ Invite Internal User]`.
- Table: Name, Email, Role (admin/ops/finance/cs), Last Login, Status, Created At, Actions.
- Per-row `[Edit Role]` `[Deactivate]` `[Resend Invite]` (if pending).
- **Invite flow:** Dialog (email, full_name, role dropdown). Submit calls `inviteInternalUser()`. Activation link goes to `/internal/activate` (NOT `/activate`). No callback step.

## `/audit-log` (superadmin only)

- Heading "Audit Log".
- Subtext: "Every backoffice action is logged."
- Filters: Actor, Entity Type, Action, Date Range.
- Table: Timestamp, Actor (`real_name` + role), Action, Entity Type, Entity ID.
- Per-row `[Expand]` → shows before/after JSON diff (collapsible).
- Export to CSV button top right.

## `/settings`

- Heading "Platform Settings".
- Sections:
  - Tax: VAT rate (default 0.15)
  - Operational defaults: default lead time days (7), RFQ expiry days (7), auto-quote admin hold threshold (SAR 25,000)
  - Auto-quote master switch: ON/OFF
  - Email templates: editor for activation email, quote received, order confirmation
- `[Save All]` → calls `updatePlatformSettings()`.

## Verification

- Visit `backoffice.mwrd.io` → redirected to `/login` (not `/register`).
- Sign in as `admin@mwrd.com` → sees backoffice dashboard.
- Try signing in as `client@mwrd.com` on backoffice → error "This portal is for internal users only." No helpful redirect.
- Try accessing `client.mwrd.io` while logged in as admin → error "wrong portal".
- `/leads` queue: see registered Hassan from Prompt 3 verification.
- Mark Hassan's callback complete with notes "Confirmed business details, sole proprietor." → Hassan moves to KYC queue, activation email link logged to console.
- Copy activation link, open in incognito → `/activate` page renders, set password, redirected to `/onboarding`.
- Back in backoffice: `/offer-approvals` shows Sarah Supplier's offer from Prompt 5 verification. Approve it. Verify offer status flips to active and is now used in auto-quote matching.
- `/product-requests` shows Sarah's product addition request. Approve with edits. Verify new `MasterProduct` created.
- `/quote-manager`: see admin-held auto-quote (one of the seed quotes total >SAR 25k). Drag margin slider, see final price update. Click Send to Client.
- `/users/internal`: invite a new ops user. Verify activation email logged.
- `/audit-log`: verify previous actions appear with correct actor, `entity_type`, before/after.
- Idle for 16+ min, refresh → kicked to `/login`.
