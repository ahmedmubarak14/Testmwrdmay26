# Prompt 7 — Mobile app (Expo, single codebase, no backoffice)

Single Expo codebase. Serves client and supplier roles, route-grouped at sign-in. **Backoffice is web-only — never on mobile.**

---

Build the MWRD mobile app at `apps/mobile`. Single Expo codebase serves client and supplier roles. Role detected at sign-in → renders the appropriate route group. **NO BACKOFFICE on mobile, ever.**

## Stack

- Expo SDK 51+, Expo Router (file-based)
- NativeWind (Tailwind for React Native)
- TanStack Query, React Hook Form, Zod
- `@mwrd/shared` imported directly (same data API as web)
- `packages/auth-public` consumed for shared auth logic (mobile UI variant — native screens, same logic)
- `expo-localization` for EN/AR with `I18nManager` for RTL
- `expo-secure-store` for token + user persistence

## App structure (`apps/mobile/app/`)

```
(auth)/
  login.tsx              Email + password sign-in
  register.tsx           Minimal: name, email, account type, phone, company name. Account type segmented control.
  thank-you.tsx          'We will call you within 24 hours' confirm
  activate.tsx           Set password (deeplink from activation email)

(client)/
  _layout.tsx            Bottom tabs
  index.tsx              Dashboard (action cards, recent activity)
  catalog/
    index.tsx            Browse categories grid (NO PRICES)
    [categorySlug].tsx   Master product grid (no prices, just info)
    products/[id].tsx    Master product detail, [Add to RFQ] CTA
    bundles/index.tsx    Bundle grid
    bundles/[slug].tsx   Bundle detail, [Add Bundle to RFQ]
  custom-request/
    new.tsx              Multi-step wizard for off-catalog items
  rfqs/
    index.tsx            RFQ list with status badges
    [id].tsx             RFQ detail, summary of received quotes
    [id]/compare.tsx     Line-item comparison (mobile-optimized)
  cart/
    index.tsx            Active RFQ draft
    saved.tsx            Saved RFQ drafts (with 7-day expiry)
  orders/
    index.tsx            Order list with Waiting Approval tab
    [id].tsx             Order detail, GRN flow
  account/
    index.tsx            Account hub: Users, Roles, Approval Tree, Addresses
  profile.tsx            Settings, language toggle, sign out

(supplier)/
  _layout.tsx            Bottom tabs
  index.tsx              Dashboard
  catalog/
    index.tsx            Browse master catalog with [Sell This] CTAs
    [categorySlug].tsx   Browse by category
    products/[id].tsx    Master product detail, [Sell This] CTA (NO competitor data shown)
  rate-card.tsx          List of own offers, edit, toggle auto-quote per offer
  product-request/
    new.tsx              Submit Product Addition Request
    history.tsx          List of own requests with status
  rfqs/
    index.tsx            Open RFQs (client alias only, no count of other quoters)
    [id]/quote.tsx       Quote builder. Auto-quote draft if applicable.
  quotes.tsx             My quotes list
  orders/
    index.tsx            SPOs (Won / Completed / Pending tabs)
    [id].tsx             Order detail
    [id]/dn.tsx          Create delivery note
  profile.tsx            Settings
```

## Bottom tabs

- **Client:** Home | Catalog | RFQs | Orders | Profile (5 tabs)
- **Supplier:** Home | Catalog | RFQs | Orders | Profile (5 tabs)

Note: supplier "Catalog" is browse-master-catalog-to-sell, not client's browse-master-catalog-to-buy. Same screens, different CTAs and data shown.

## Auth flow

- `packages/auth-public` exports shared logic (validation, API signatures) but mobile renders its own native screens
- `/(auth)/register`: form posts to `register()` → redirects to `/(auth)/thank-you`
- `/(auth)/login`: `signIn()` → if `user.role IN {client, supplier}`, store `{token, user}` in `expo-secure-store`, route to appropriate group. If admin/ops/finance/cs → show "This portal is web-only" message, sign out, do not store session.
- Root `_layout` reads from secure-store on mount, routes accordingly
- Logout clears secure-store, routes to `/(auth)/login`

## Key UX rules

- 5 tabs max, big tap targets (44pt minimum)
- Pull-to-refresh on all lists, infinite scroll
- Skeleton loading screens, NOT spinners
- Errors: inline below field + toast for network errors
- RTL: when language='ar', `I18nManager.forceRTL(true)` + reload
- Anonymity: same rules as web, enforced at data layer
- Forms: one logical block per screen, native pickers (date, currency)
- Empty states: friendly icon + 1-line copy + CTA

## Mobile-specific UX considerations

**Line-item comparison view (THE killer mobile UX challenge):**

- Web: side-by-side table, all suppliers in columns.
- Mobile: horizontal swipe between RFQ line items. For each line item, vertical list of supplier cards (alias, price, lead time, `[Select]` button). Selected supplier highlighted.
- Bottom sticky bar: "Selections: X of Y items priced. Total: SAR Z. `[Confirm Awards]`"
- Tab to switch to "Award entire RFQ to one supplier" view (vertical list of full-basket totals per supplier).

**Custom Request form:**

- Multi-step wizard: Step 1 (Basics), Step 2 (Items), Step 3 (Review). Progress dots top, `[Back]` `[Next]` bottom-sticky.

**Supplier rate card management:**

- `/catalog` → tap a master product → `[Sell This]` CTA → bottom sheet form: pack-type pricing inputs, lead time stepper, min order qty, auto-quote toggle. Save → creates draft offer → goes to backoffice approval queue.
- Fully blind: no aggregate competitor data, no hint at how many other suppliers sell this.

## Localization

- `expo-localization` to detect device locale on first launch
- `apps/mobile/locales/en.json` + `ar.json` (same KEY structure as web apps' next-intl messages)
- Custom `useT()` hook
- Toggle in `/profile` applies immediately + persists

## Notifications stub

- `packages/shared` exports `sendNotification()` — on mobile, `console.log`
- Hook for Expo Notifications wired but disabled in MVP

## Verification

- `npx expo start`, scan QR with Expo Go
- Register a new supplier on mobile (minimal form) → see thank-you screen
- Switch to web backoffice as admin → see lead in `/leads` → mark callback complete → activation email logged
- Tap activation link on mobile → `/(auth)/activate` → set password → redirected to supplier dashboard
- As supplier on mobile: browse master catalog, tap `[Sell This]` on a product, fill pricing form, save → verify offer appears in backoffice approval queue
- After admin approval, sign in as client (incognito web), create RFQ for the same master product
- Switch back to supplier mobile → notification (badge) for new RFQ → open RFQ → if auto-quote was on, see pre-filled draft quote → edit if needed → send
- Switch to client web → see comparison view → award per-item (split CPOs)
- Toggle Arabic in `/profile` → verify RTL flips entire UI, locale persists on relaunch
- Try to log in with `admin@mwrd.com` on mobile → see "web-only" message, no portal access
