# Prompt 8 — Wire Supabase (Phase 2)

---

Replace the in-memory mock data layer in `@mwrd/shared` with real Supabase calls. Wire Supabase Auth for both public and backoffice with separate `aud` claims. Apply RLS to every table. Anonymity-aware Postgres views for client and supplier reads.

Project provisioning is manual (you do this in the Supabase dashboard first, then this prompt scaffolds the schema and wires the client).

## Step 0 — Manual setup (you, before running this prompt)

- Create Supabase project. **Region: `me-south-1` (Bahrain).**
- Note the Project URL and anon key.
- Create env vars in each web app + mobile:
  - `EXPO_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Create separate auth providers in Supabase:
  - Email auth ENABLED for both public and backoffice.
  - Use a custom JWT claim `aud` to distinguish:
    - `aud='public'` for client+supplier
    - `aud='backoffice'` for admin/ops/finance/cs

## Step 1 — Schema SQL

Generate `supabase/migrations/0001_initial_schema.sql` with:

- All tables matching the TypeScript types in `@mwrd/shared/src/types`
- UUID primary keys (`uuid_generate_v4()`)
- Foreign keys with proper `ON DELETE` behaviour
- `created_at` / `updated_at` with default `now()` and trigger for `updated_at`
- All enum types as Postgres ENUMs
- Indexes on common query paths:
  - `master_products(category_id)`, `offers(master_product_id)`, `offers(supplier_company_id)`, `rfqs(client_company_id)`, `quotes(rfq_id)`, `quotes(supplier_company_id)`, `pos(client_company_id)`, `pos(supplier_company_id)`, `audit_logs(actor_user_id, created_at)`
- Soft-delete columns (`deleted_at`) on user-mutable tables

## Step 2 — RLS policies

Enable RLS on EVERY table. Generate policies:

- **Categories, master_products, bundles**: SELECT for all authenticated users; INSERT/UPDATE/DELETE only for `aud='backoffice'` AND role IN `('admin','ops')`
- **Offers**: SELECT for offer's supplier OR `aud='backoffice'`. INSERT/UPDATE only for offer's supplier (with `approval_status='pending'`). Approval status changes only for `aud='backoffice'`.
- **Product addition requests**: SELECT for own supplier OR backoffice. INSERT only for suppliers. Status changes only for backoffice.
- **Carts, favourites, company catalogs**: SELECT/UPDATE only for owning user.
- **RFQs**: SELECT for client's company OR for any supplier matched to it (via offers/categories) OR backoffice. INSERT only for clients.
- **Quotes**: SELECT for own supplier (writer) OR client (recipient) OR backoffice. INSERT/UPDATE only for own supplier. **CRITICAL RLS rule:** when client SELECTs a Quote, the policy must filter out columns `supplier_unit_price_sar` from `QuoteItems`. Implement via a VIEW (see Step 3).
- **POs**: SELECT for client OR supplier on the PO OR backoffice.
- **Address, Member, Role, ApprovalNode**: SELECT/UPDATE for own company.
- **AuditLog**: INSERT for any backoffice user; SELECT only for superadmin.
- **Internal users management**: only superadmin (custom claim) can write.

## Step 3 — Anonymity-aware views

```sql
CREATE VIEW v_supplier_rfqs (used by listOpenRFQsForSupplier):
  Columns: rfq_id, rfq_number, title, description, delivery_city,
   delivery_date, status, source, created_at, expires_at, items
  STRIPS: client_company_id (replaced with NULL),
   client.real_name (replaced with NULL)
  No supplier-aggregate counts (no 'X suppliers received this')

CREATE VIEW v_client_quotes (used by listQuotesForRFQ on client):
  Columns: quote_id, quote_number, rfq_id, status, valid_until,
   lead_time_days, items_with_final_price
  STRIPS: supplier_unit_price_sar from items (replaced with NULL)
   supplier real_name (replaced with platform_alias)

CREATE VIEW v_supplier_orders (used by supplier-side order list):
  Columns: po_id, po_number, type, status, created_at, total_sar,
   items, client_alias
  STRIPS: client_company_id, client.real_name
```

All client/supplier-facing reads in `@mwrd/shared/data` go through these views, not raw tables. Backoffice reads from raw tables.

## Step 4 — Auth wiring

`packages/auth-public` auth functions (login, register, activate) now call `supabase.auth.signInWithPassword`, `signUp`, etc.

On `signUp`: create User row with `status='pending_callback'` via RPC (supabase function), DO NOT auto-set password (Supabase will create the auth user but our domain user has `activation_status='awaiting_callback'`).

Public auth always sets `aud='public'` in JWT claims via custom auth hook. Reject if `aud!='public'` on public middleware.

`apps/backoffice/lib/auth.ts` wires its own Supabase client with `aud='backoffice'` enforcement. Reject if `aud!='backoffice'`.

## Step 5 — Replace data layer

Replace `packages/shared/src/data/index.ts` with Supabase client calls. **Function signatures NEVER change. Only the bodies.**

Example transformation:

```ts
// BEFORE (mock):
export async function listMasterProducts(filters) {
  return Array.from(masterProductsStore.values())
    .filter(p => filterMatch(p, filters))
}

// AFTER (Supabase):
export async function listMasterProducts(filters) {
  let q = supabase.from('master_products').select('*')
    .eq('status', 'active')
  if (filters.category_id) q = q.eq('category_id', filters.category_id)
  if (filters.search) q = q.ilike('name_en', `%${filters.search}%`)
  const { data, count } = await q.range(...)
  return { data: data ?? [], total: count ?? 0 }
}
```

Anonymity-aware functions use views:

- `listOpenRFQsForSupplier`: select from `v_supplier_rfqs`
- `listQuotesForRFQ` (client side): select from `v_client_quotes`

## Step 6 — Storage

Create Supabase Storage buckets:

- `kyc-docs` (private, signed URLs only)
- `master-product-images` (public-read, admin-write only)
- `supplier-offer-photos` (private, signed URLs only)
- `invoices` (private, signed URLs only)
- `delivery-proofs` (private, signed URLs only)

Replace base64 image handling with upload-to-bucket + signed URL.

## Step 7 — Edge functions stubs (deploy in Phase 3)

- `supabase/functions/zatca-submit/index.ts` (stub for now)
- `supabase/functions/moyasar-webhook/index.ts` (stub for now)
- `supabase/functions/process-auto-quotes/index.ts`:
  - Cron-style function called every 5 min.
  - Calls `processAutoSendQueue()` on quotes with `status='draft_auto'` and `auto_send_at <= now`.
  - Routes to client or admin based on threshold.

## Step 8 — Migrate seed users

Run a one-time migration script that:

- Creates real Supabase Auth users for the 3 seed accounts (`client@mwrd.com` / `client123`, `supplier@mwrd.com` / `supplier123`, `admin@mwrd.com` / `admin123`)
- Inserts corresponding User and Company rows
- Imports seed master products, categories, bundles, offers
- Imports seed margins and platform settings

## Verification

- Sign in as `client@mwrd.com` on `client.mwrd.io` → dashboard loads, data reads from Supabase.
- Sign in as `supplier@mwrd.com` → only supplier's offers visible.
- Sign in as `admin@mwrd.com` on `backoffice.mwrd.io` → backoffice loads.
- Try to fetch a Quote as client via raw API call → RLS blocks (or strips `supplier_unit_price`).
- Verify `v_supplier_rfqs` view does NOT return client `real_name`.
- Verify backoffice middleware rejects `aud='public'` tokens.
- Verify public middleware rejects `aud='backoffice'` tokens.
- Submit a new RFQ as client → auto-quote engine creates draft quotes via direct insert. After 30 min (or via manual edge function trigger), `processAutoSendQueue` routes them.
- Run an audit log query as superadmin: see all backoffice actions recorded.
