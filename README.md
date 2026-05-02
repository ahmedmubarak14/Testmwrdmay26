# MWRD Platform

Anonymous B2B procurement platform for Saudi Arabia. Quote-only model with admin-curated master catalog and supplier offers.

> **Status:** pre-build. The repo currently contains the strategic brief and build prompts only. The monorepo scaffold lands when [Prompt 1](docs/build/01-monorepo-scaffold.md) is run.

## What's in this repo (today)

```
.
├── CLAUDE.md                     # The constitution. Always loaded by Claude Code.
├── docs/
│   ├── strategic-brief.md        # Full v3 brief: positioning, model, data, screens
│   └── build/                    # Numbered build prompts, run sequentially
│       ├── 01-monorepo-scaffold.md
│       ├── 02-shared-package.md
│       ├── 03-public-auth.md
│       ├── 04-client-portal.md
│       ├── 05-supplier-portal.md
│       ├── 06-backoffice.md
│       ├── 07-mobile.md
│       ├── 08-supabase-wiring.md
│       └── 09-zatca-moyasar-notifications.md
└── README.md
```

## What this becomes (after Prompt 1)

A Turborepo monorepo:

```
mwrd-platform/
├── apps/
│   ├── client/        → client.mwrd.io        (Next.js 15)
│   ├── supplier/      → supplier.mwrd.io      (Next.js 15)
│   ├── backoffice/    → backoffice.mwrd.io    (Next.js 15)
│   └── mobile/        → iOS + Android         (Expo)
├── packages/
│   ├── shared/        → types, schemas, utils, mock data layer
│   ├── auth-public/   → shared client+supplier auth (NOT used by backoffice)
│   ├── ui-web/        → shared shadcn components
│   ├── ui-mobile/     → shared NativeWind components
│   └── config/        → eslint, tsconfig, tailwind base
├── turbo.json
└── package.json
```

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

## Seed credentials (Phase 1, mock data)

| Role | Email | Password |
|---|---|---|
| Client | client@mwrd.com | client123 |
| Supplier | supplier@mwrd.com | supplier123 |
| Admin | admin@mwrd.com | admin123 |

## Local development (after Prompt 1)

```bash
npm install
npm run dev
```

Ports:
- `client` → http://localhost:3000
- `supplier` → http://localhost:3001
- `backoffice` → http://localhost:3002
- `mobile` → Expo dev server

## License

Proprietary. © Byan Solutions Company.
