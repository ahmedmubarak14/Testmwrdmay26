# MWRD Platform

Anonymous B2B procurement platform for Saudi Arabia. Quote-only model with admin-curated master catalog and supplier offers.

> **Status:** Prompt 1 (monorepo scaffold) complete. Apps and packages exist and boot to a hello-world page. Prompt 2 (shared package) is next.

## Repository layout

```
.
├── CLAUDE.md                     # The constitution. Always loaded by Claude Code.
├── apps/
│   ├── client/        → client.mwrd.io        (Next.js 16, port 3000)
│   ├── supplier/      → supplier.mwrd.io      (Next.js 16, port 3001)
│   ├── backoffice/    → backoffice.mwrd.io    (Next.js 16, port 3002)
│   └── mobile/        → iOS + Android         (Expo SDK 54)
├── packages/
│   ├── shared/        → @mwrd/shared      types, schemas, utils, mock data layer
│   ├── auth-public/   → @mwrd/auth-public shared client+supplier+mobile auth (NOT used by backoffice)
│   ├── ui-web/        → @mwrd/ui-web      shared shadcn primitives
│   ├── ui-mobile/     → @mwrd/ui-mobile   shared NativeWind primitives
│   └── config/        → @mwrd/config      shared lint/tsconfig/tailwind base
├── docs/
│   ├── strategic-brief.md
│   └── build/                    # Numbered build prompts, run sequentially
├── turbo.json
└── package.json
```

> Note: shadcn/ui was scaffolded with `--rtl` for client + supplier, and without `--rtl` for backoffice (English-only). Both cases use Tailwind v4 + base-ui.

## Build order

Run prompts **sequentially**. Each one's verification step is the gate to the next.

1. [Monorepo + apps scaffold](docs/build/01-monorepo-scaffold.md)
2. [Shared package: types, schemas, mock data](docs/build/02-shared-package.md) ← **load-bearing prompt**
3. [Public auth package](docs/build/03-public-auth.md)
4. [Client portal](docs/build/04-client-portal.md)
5. [Supplier portal](docs/build/05-supplier-portal.md)
6. [Backoffice (separate auth)](docs/build/06-backoffice.md)
7. [Mobile app (Expo)](docs/build/07-mobile.md)
8. [Wire Supabase (Phase 2)](docs/build/08-supabase-wiring.md)
9. [ZATCA + Moyasar + notifications (Phase 3)](docs/build/09-zatca-moyasar-notifications.md)

## Phases & realistic timeline

| Phase | Deliverable | Estimate |
|---|---|---|
| **Phase 1** | Working prototype on in-memory mock data, all 4 apps, all flows end-to-end | 8–10 weeks |
| **Phase 2** | Supabase wired (Bahrain region), RLS, anonymity-aware views | 2–3 weeks |
| **Phase 3** | ZATCA Phase 2 invoicing, Moyasar payments, Resend emails, Expo push | 3–4 weeks |
| **Total to production** | | **~13–17 weeks** |

ZATCA Phase 2 credential approval and Moyasar merchant account onboarding can each take 2–6 weeks. **Apply for both on day 1**, in parallel with Phase 1 build.

## The four locked product decisions

1. **Auth split** — public auth shared (client + supplier), backoffice fully separate.
2. **Quote-only client experience** — no public prices anywhere, ever.
3. **Master catalog with supplier offers** — admin owns canonical products; suppliers attach price-and-availability records.
4. **Suppliers operate fully blind** — no competitor signals, no aggregate ranges, no winner identity on rejection.

Full rationale in [`docs/strategic-brief.md`](docs/strategic-brief.md). Enforcement rules live in [`CLAUDE.md`](CLAUDE.md).

## Seed credentials (introduced in Prompt 2)

| Role | Email | Password |
|---|---|---|
| Client | client@mwrd.com | client123 |
| Supplier | supplier@mwrd.com | supplier123 |
| Admin | admin@mwrd.com | admin123 |

## Local development

```bash
npm install
npm run dev          # starts all apps via turbo
npm run type-check   # tsc --noEmit across the workspace
```

Run a single app:

```bash
npm run dev --workspace=client       # http://localhost:3000
npm run dev --workspace=supplier     # http://localhost:3001
npm run dev --workspace=backoffice   # http://localhost:3002
npm run dev --workspace=mobile       # Expo dev server
```

## License

Proprietary. © Byan Solutions Company.
