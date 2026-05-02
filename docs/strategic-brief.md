# MWRD — Strategic MVP Build Brief (v3)

> Quote-only model with master catalog and supplier offers
> Prepared for Ahmed Mubarak, Co-founder, Byan Solutions Company
> May 2026

## Scope

Strategic MVP. Quote-driven model with master catalog. **No public prices anywhere.** Suppliers attach offers to admin-curated master products. Auto-quote engine with supplier review window. Line-item comparison with split awards. Account Management. Bundles. Saved Carts and Company Catalogs. Everything else is v2.

### In scope

**Apps and platforms**

- Three web apps: client.mwrd.io, supplier.mwrd.io, backoffice.mwrd.io
- One Expo mobile app serving both client and supplier roles (single codebase)
- English and Arabic with full RTL
- SAR currency throughout, 15% VAT line items shown explicitly

**Auth**

- Public shared auth (client + supplier) via `packages/auth-public`, mounted on both client and supplier domains
- Backoffice auth fully separate, lives only in `apps/backoffice`, no public registration
- Minimal registration form: name, email, account type, phone, company name
- Callback activation flow: signup → "we'll call within 24 hours" → ops calls → activation email → password set
- Onboarding wizard on first login captures the rest of company info

**Catalog architecture**

- Two-tier: admin-owned Master Catalog + supplier-owned Offers
- Master Products: name, specs, images, pack types, all admin-curated (single source of truth)
- Offers: per-supplier price-and-availability records attached to master products
- Product Addition Requests: suppliers can submit new product proposals to admin
- Pre-launch seeding: 200–300 master products across the strongest 3 categories

**Quote engine (Model B with auto-quote)**

- RFQ is the only client entry point. No public catalog prices, ever.
- Per-offer auto-quote toggle (supplier opts in per product)
- Auto-quote review window: instant / 30 min / 2 hr (per-supplier setting)
- Supplier can edit any line, decline any line, or send immediately
- Margin engine: server-side, per category and per client, never visible to either party
- Auto-quotes above SAR threshold hold for admin Quote Manager review
- Suppliers operate fully blind — no competitor pricing signals

**Client experience**

- Browse master catalog by category (no prices, just product info)
- RFQ builder: add master products with qty and pack type, or submit Custom Request for off-catalog items
- Line-item comparison view: each RFQ item compared across all responding suppliers
- Per-item award (split CPOs across suppliers) OR full-basket award (single supplier)
- Bundles: pre-built multi-item kits, one-click add to RFQ
- Saved Carts (RFQ drafts) with 7-day expiry, multiple parked baskets
- Company Catalogs: curated approved-product lists for repeat ordering
- Account Management: Users, Roles, Approval Tree, Addresses
- Approval Tree gates every order through a configurable approver chain

**Supplier experience**

- Browse master catalog with "Sell this product" CTA
- Offer management: per-pack-type cost prices, lead time, min order qty, auto-quote toggle
- Product Addition Request flow for items not in master catalog
- Auto-quote review queue: edit before send, or accept the auto-draft
- Order management with anonymized client codes (`Client-XXXX` format)
- Delivery Note creation flow

**Backoffice**

- Master Catalog Management: create/edit/deprecate master products, manage categories
- Product Addition Request queue: review, approve (creates master product), or reject
- Offer Approval Queue: first-time supplier offer verification
- Quote Manager: margin slider per quote, threshold-based hold logic, send to client
- Leads Queue: pending callbacks from new signups
- KYC Queue: post-callback document verification
- Three-Way Match: PO × GRN × Invoice variance review
- Internal users management (superadmin only): invite ops, finance, cs
- Audit log of every backoffice action

**Documents and operations**

- Dual PO system (CPO + SPO linked by `transaction_ref`)
- Delivery Notes (DN), Goods Receipt Notes (GRN), Invoices (INV)
- Three-way matching within 2% variance tolerance
- ZATCA Phase 2 stub (TLV generator returns null in MVP, real impl in Phase 3)
- Moyasar stub (mock payment intent in MVP, real impl in Phase 3)
- Mock data layer with single swap point for Supabase (Phase 1 → Phase 2)

### Deferred to v2

- Wallet and Transaction History
- Reports module (Spendings Report, Product Invoicing Summary)
- Subscriptions (recurring orders monthly/quarterly)
- Company Contracts (frame agreements with locked pricing)
- Analytics Tags (cost-center coding at checkout)
- Bulk Orders
- Customer Service ticketing
- Push notifications (function stubbed, not wired)
- BNPL or credit facilitation
- WhatsApp intake channel
- Tiered pricing (qty break-points)
- Tag-based fuzzy matching for auto-quote
- CSV bulk upload for supplier offers
- Aggregate competitor pricing signals to suppliers
- Client-driven product addition requests
- Supplier rating and review system
- AI features (auto-categorisation, quote summarisation, predictive pricing)
- 2FA for backoffice (mandatory) and public auth (optional)

### Defer-but-prepare

These are not built in MVP, but the data model, function stubs, and UI placeholders ARE created so that turning them on later is a configuration change, not a refactor:

- ZATCA submission to Fatoora (TLV generator function exists, returns null)
- Moyasar capture (`createPaymentIntent` function exists, returns mock id)
- Email and SMS notifications (`sendNotification` function exists, console.logs)
- File uploads to cloud storage (mock base64 in Phase 1, swap to Supabase Storage in Phase 2)
- Push notifications (`sendPushNotification` function exists, console.logs)

## Competitive positioning

### Lawazem and Brkz, briefly

**Lawazem** is the dominant Saudi B2B operational procurement platform, founded 2020, with about USD 9.3M raised and 100+ enterprise clients. They run a curated catalog with 10,000+ SKUs, serve 15 categories, and ship in two modes: Express (24hr) and Marketplace (72hr). Their differentiator is enterprise depth: multi-user company accounts with roles, approval trees, billing addresses, wallets, reports, contracts, subscriptions, analytics tags, and ZATCA-compliant invoicing.

**Brkz** is a vertical play in construction materials, founded 2022, with about USD 22.5M equity plus a USD 30M growth debt facility from Stride Ventures (Oct 2025). They run a managed marketplace with embedded BNPL aligned to construction cash flow cycles (60–180 days). They process about USD 837M in cumulative RFQ volume across 850+ contractors. They explicitly walked back MENA expansion to go deeper into KSA construction.

### Where MWRD wins

Both incumbents operate transparent marketplaces where buyer and supplier identities are visible to each other. **That is the structural weakness:** once buyer and supplier know each other, the second order goes around the platform. MWRD's anonymity layer eliminates this disintermediation risk entirely. Aliases on both sides, real identities only at backoffice.

MWRD's quote-only model with master catalog is a sharper architecture than either incumbent. Lawazem leads with public-priced catalog, which means suppliers and competitors can reverse-engineer margins. Brkz leads with RFQ but has no master catalog, which means every quote is a custom one and auto-quote logic is impossible at scale. MWRD combines both: a master catalog suppliers attach offers to (so auto-quote matching is trivial), with a quote-only client experience (so margin protection is total).

**Third moat:** Custom Request mode. When a client needs something not in the master catalog, they describe it in free text and suppliers manually quote. Lawazem cannot do this — they only sell what is in their catalog. Brkz does this but has no catalog fallback. MWRD does both, smoothly.

**Fourth moat:** workflow depth. Dual PO system (CPO and SPO linked by `transaction_ref`), three-way matching (PO × GRN × Invoice within 2% variance), Approval Tree gating every order. This is the procurement plumbing finance directors need to adopt the platform. No incumbent has it as a default flow.

### Side-by-side

| Dimension | Lawazem | Brkz | MWRD |
|---|---|---|---|
| Client entry point | Public catalog with prices | RFQ form, no catalog | Master catalog (no prices) + RFQ + Custom Request |
| Public prices | Yes, all SKUs | None | None. Quote-only. |
| Catalog ownership | Supplier-listed (curated) | No catalog | Admin-owned master catalog, suppliers attach offers |
| Auto-quote | Catalog price = instant | 20-min auto-quote (custom) | Per-offer toggle, supplier review window, threshold-based admin hold |
| Anonymity | None | None | Full. Aliases both sides, real identities only at backoffice. |
| Margin model | Marketplace markup, suppliers can reverse-engineer | Transaction fee + financing margin | Per category, per client, server-side only. Invisible to both parties. |
| Document depth | Standard PO + invoice | Standard PO + invoice | Dual PO (CPO + SPO), DN, GRN, three-way match, ZATCA invoice |
| Approval workflow | Approval Tree, multi-level | Not visible | Approval Tree, multi-level (in MVP) |
| Multi-supplier basket | No (single-cart checkout) | No (one-quote-at-a-time) | Yes. Line-item comparison, split awards across suppliers. |
| Funding | USD 9.3M equity | USD 22.5M equity + USD 30M debt | Bootstrapped pre-launch |

## Core model — four locked product decisions

### Decision 1 — Auth split

Public auth is shared between clients and suppliers. They sign up on the same page, log in on the same page, the only difference is the account type they pick at registration. Backoffice auth is completely separate, lives only in `apps/backoffice`, has no public registration, and uses different session policies.

**Why**

- Clients and suppliers have similar trust requirements. Both go through callback verification, both have KYC, both use the same activation email mechanism. Sharing the auth surface reduces code duplication and gives both sides a consistent UX.
- Backoffice has fundamentally different threat model. Internal users have access to real identities, margin data, and approval overrides. They need stricter session policies (15-min idle vs 24-hour for public), no public registration (invite-only), and isolated audit logs. Sharing auth with public users would compromise this.
- From a security questionnaire standpoint (relevant when raising capital), separate backoffice auth is the table-stakes answer to "how do you control admin access".

**Implementation**

- `packages/auth-public` exports shared login, register, register/thank-you, activate pages
- Mounted on both client.mwrd.io and supplier.mwrd.io at the same paths
- After login: role-based redirect. Client → client portal. Supplier → supplier portal. Backoffice roles → 403 (no helpful redirect to backoffice URL).
- `apps/backoffice` has its own `/login` at backoffice.mwrd.io/login. Public roles → 403.
- Different Supabase Auth `aud` claims for public vs backoffice tokens

### Decision 2 — Quote-only client experience

No public prices anywhere. Clients browse the master catalog to see what's available (names, specs, images) but never see prices. Every interaction starts as an RFQ. The system either auto-quotes (if suppliers have matching offers with auto-quote on) or waits for manual quotes (if not). The client then compares incoming quotes line-by-line and awards per-item or per-basket.

**Why**

- Margin protection. Without public prices, suppliers cannot reverse-engineer MWRD's markup.
- Per-client pricing flexibility. Different clients can legitimately see different prices for the same product. No "public price" constraint.
- Anonymity preservation. Public prices would let suppliers scrape the catalog as fake clients. Quote-only blocks this.
- Premium positioning. "Custom-quoted for you" reads as enterprise-grade, not retail.
- Auto-quote from rate cards keeps speed comparable to a public catalog for matched items.

### Decision 3 — Master catalog with supplier offers

MWRD admin owns the master catalog: categories, subcategories, master products with canonical names, specs, images, and pack types. Suppliers do not create products. Suppliers create Offers — price-and-availability records attached to master products. If a supplier wants to sell something not in the master catalog, they submit a Product Addition Request that admin reviews.

**Why**

- Auto-quote matching becomes trivial. Two suppliers with offers on `master_product_id=4521` are matchable instantly. No fuzzy logic.
- Line-item comparison view becomes clean. Same product, same specs, just different supplier prices.
- Quality control happens once. Admin curates specs and images. Suppliers attach prices, not content.
- Supplier onboarding is faster. They tick boxes and enter prices, don't write descriptions.
- Search and filtering actually work. Consistent specs (chair material: mesh/leather/fabric) means clients can filter properly.

### Decision 4 — Suppliers operate fully blind

Suppliers see only their own offers, their own quotes, their own orders. They do not see other suppliers' prices, do not see aggregate price ranges, do not see how many other suppliers are quoting on the same RFQ.

**Why**

- Maximum margin flexibility for MWRD. Suppliers can't price-coordinate or undercut deliberately.
- Forces suppliers to compete on quality and lead time, not just price.
- Maintains anonymity model: no signal that could leak supplier identities or relationships.
- Simpler MVP: no aggregation logic, no comparison UI on supplier side.

## Architecture

### Build philosophy

**1. Working prototype before database.** Phase 1 builds every screen and every flow against an in-memory mock data layer. The data layer lives in one file (`packages/shared/src/data/index.ts`) and exports the full data API. Replace that one file with Supabase calls in Phase 2; nothing else changes.

**2. ZATCA and Moyasar as drop-in stubs.** The invoice module accepts an optional ZATCA TLV; today the function returns null and the PDF renders without a QR code. The order module accepts an optional payment intent; today it returns a mock paid status. Phase 3 changes the implementation behind the interface, not the call sites.

**3. Shared code via packages, not copy-paste.** Auth, types, utilities, validation schemas all live in `packages/`. Apps import from packages and stay thin.

### Tech stack

**Web (3 apps)**

- Next.js 15 with App Router, TypeScript strict mode
- Tailwind CSS plus shadcn/ui
- next-intl for English and Arabic with RTL
- React Hook Form plus Zod for forms and validation
- TanStack Query for server state
- @react-pdf/renderer for PDF generation (CPO, SPO, DN, GRN, INV)

**Mobile (1 app)**

- Expo SDK 51+ with EAS Build
- Expo Router (file-based, like Next.js App Router)
- NativeWind (Tailwind for React Native)
- Same TypeScript types and Zod schemas reused from `packages/shared`
- Same TanStack Query for data fetching
- Single codebase serves both client and supplier roles, role detected at sign-in

**Backend (Phase 2)**

- Supabase: PostgreSQL plus Auth plus Storage plus Realtime
- Region: Bahrain (`me-south-1`) for SDAIA data residency
- Row Level Security on every table
- Edge Functions for ZATCA submission and Moyasar webhooks (Phase 3)
- Separate `aud` claims for public vs backoffice auth tokens

**Hosting**

- Web: Vercel, one project per app
- Mobile: EAS Build to App Store and Play Store
- Database: Supabase managed (Bahrain)
- Domains: client.mwrd.io, supplier.mwrd.io, backoffice.mwrd.io

### Monorepo layout

```
mwrd-platform/
├── apps/
│   ├── client/           → client.mwrd.io        (Next.js 15)
│   ├── supplier/         → supplier.mwrd.io      (Next.js 15)
│   ├── backoffice/       → backoffice.mwrd.io    (Next.js 15)
│   └── mobile/           → Expo (iOS + Android, single codebase)
├── packages/
│   ├── shared/           → types, schemas, utils, MOCK DATA LAYER
│   │   ├── src/types/         → User, Company, MasterProduct, Offer,
│   │   │                        RFQ, Quote, PO, GRN, Invoice,
│   │   │                        Bundle, Cart, Catalog, Approval
│   │   ├── src/validations/   → zod schemas for every entity
│   │   ├── src/utils/         → aliases, margins, numbers, ZATCA stub,
│   │   │                        three-way-match, payments stub,
│   │   │                        approval-chain, auto-quote engine
│   │   └── src/data/          → THE SWAP POINT. Mock today, Supabase later.
│   ├── auth-public/      → shared login/register for client+supplier
│   │                       (NOT used by backoffice)
│   ├── ui-web/           → shared shadcn components for web apps
│   ├── ui-mobile/        → shared NativeWind components
│   └── config/           → eslint, tsconfig, tailwind base
├── turbo.json
└── package.json
```

`packages/shared/src/data/index.ts` is **the swap point**. Today it exports mock functions backed by in-memory Maps. Tomorrow you replace that one file with Supabase client calls. Every app keeps working without a single line changed in any other file.

`packages/auth-public` is **NOT** imported by `apps/backoffice`. The backoffice has its own auth implementation entirely. This is intentional and not negotiable.

### Phased build

**Phase 1 — working prototype (week 1 to 3)**

- Scaffold the monorepo, four apps, four packages
- Build the mock data layer with three seed users (client@, supplier@, admin@)
- Seed 200 master products across 3 categories
- Build `packages/auth-public` with login, register, register/thank-you, activate
- Build separate auth in `apps/backoffice`
- Build all four app shells
- Implement every flow end-to-end: registration with callback flow, master catalog browse, RFQ creation, supplier offer creation, auto-quote engine, manual quote, line-item comparison, split award, dual PO, GRN, invoice
- Account Management: users, roles, approval tree (orders gate through chain)
- Bundles, Saved Carts, Company Catalogs
- Backoffice: Leads queue, KYC queue, Master Catalog management, Product Addition Requests, Offer Approval, Quote Manager, three-way match
- Mobile: same flows, native UX, single codebase
- **Deliverable:** clickable end-to-end on web and mobile, all in-memory

**Phase 2 — database (week 4)**

- Supabase project in Bahrain region
- Run the schema SQL
- Replace `packages/shared/src/data/index.ts` with Supabase client calls (signatures unchanged)
- Replace `packages/auth-public` auth functions with Supabase Auth
- Backoffice gets its own Supabase Auth integration with separate `aud` claim
- RLS policies on every table
- Anonymity-aware Postgres views (`v_supplier_rfqs`, `v_client_quotes`)
- Migrate seed data to real Supabase Auth accounts
- Storage: kyc-docs, master-product-images, supplier-offer-photos, invoices, delivery-proofs (signed URLs only)
- **Deliverable:** identical UX, real persistence, real auth

**Phase 3 — ZATCA + Moyasar + notifications (week 5 to 7)**

- Apply for ZATCA Fatoora credentials
- Plug TLV generator into invoice module, render QR on invoice PDF
- Moyasar merchant account, replace mock payment intents with real ones
- Resend for email (registration confirmations, activation emails, quote notifications, order updates)
- Expo Notifications for mobile push
- **Deliverable:** production-ready

## Risks to flag during build

**RFQ-only model adoption risk.** Lawazem's catalog UX trains buyers to expect instant prices. Quote-only is a learning curve. Mitigation: pre-launch onboarding videos, sales team walks through with first 20 clients, auto-quote engine keeps speed comparable for matched items.

**Master catalog cold-start risk.** If launch catalog is too thin, suppliers churn out before adoption. Mitigation: seed 200–300 master products in 3 strongest categories before opening to suppliers. Use AI for first draft, admin curates. Continue actively expanding via Product Addition Request approvals during the first 90 days.

**Approval Tree configuration complexity risk.** Lawazem ships approval trees as setup-on-day-one for enterprise. Most clients won't bother to configure it correctly. Mitigation: Onboarding wizard offers a "Skip for now, single approver only" default that activates the simplest possible chain (1 approver = the registering user themselves). Show approval-tree health check in dashboard.

**Anonymity leak risk.** Real_name leaks are the highest-cost bug class on this platform. Every API endpoint, every PDF, every email needs anonymity audit. Mitigation: integration tests in CI that hit each endpoint as each role and grep responses for known real_names. Phase 2: Postgres views (`v_supplier_rfqs` etc.) make leaks structurally harder.

**Auth split misconfiguration risk.** If `aud` claims are not enforced strictly, a public token could grant backoffice access. Mitigation: middleware on EVERY backoffice route checks `aud='backoffice'` AND role IN backoffice set. Integration test that signs in as public user, captures token, attempts backoffice request, asserts 401.

**Auto-quote margin safety risk.** Auto-quotes apply margin without admin review for quotes below threshold. If threshold is too high, MWRD ships under-margined deals. If too low, every quote bottlenecks at admin. Mitigation: SAR 25,000 default is configurable in `/settings`. Monitor the realized margin distribution post-launch and adjust.

**Three-way match false positives.** 2% variance tolerance might be too strict for industries with weight/volume rounding (e.g., paper, beverages). Watch the three-way-match queue for high false-positive rate; consider raising tolerance per category.

**ZATCA + Moyasar timing risk.** ZATCA Phase 2 onboarding can take 2–6 weeks for credential approval. Moyasar merchant account similar. Start the application processes in parallel with Phase 1 build, not after.

## v2 backlog (in priority order)

1. Wallet + Transaction History (large enterprise expectation)
2. Reports module (Spendings Report, Product Invoicing Summary, supplier performance)
3. Subscriptions (recurring orders monthly/quarterly)
4. Company Contracts (frame agreements with locked pricing for repeat buyers)
5. Aggregate competitor pricing signals to suppliers (price ranges only, no identities) — only after 50+ active suppliers
6. CSV bulk upload for supplier offers (matters for big suppliers with 500+ SKUs)
7. Tag-based fuzzy matching for auto-quote (extends matching beyond exact `master_product_id`)
8. Tiered pricing on offers (qty break-points)
9. Client-driven product addition requests (Custom Requests can be canonized into master catalog)
10. Supplier rating and review system (anonymous, per-order)
11. Analytics Tags (cost-center coding at checkout)
12. Bulk Orders (single PO with multiple delivery sites)
13. Customer Service ticketing
14. WhatsApp intake channel for RFQs (popular in Saudi B2B)
15. AI-assisted quote summarisation in Quote Manager
16. Predictive pricing recommendations for suppliers (still preserving full blind)
17. 2FA mandatory for backoffice, optional for public
18. BNPL / credit facilitation (compete with Brkz on construction cash cycles)

---

> Build the boring plumbing perfectly. Plumbing is what makes a B2B platform credible. Lawazem's procurement-finance depth is their moat as much as their catalog breadth. MWRD's anonymity layer + master catalog + dual PO + three-way match + approval chain + audit log is the procurement plumbing finance directors need to adopt the platform.
