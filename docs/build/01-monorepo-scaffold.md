# Prompt 1 — Monorepo and shared package setup

Run this first. Sets up the workspace. **Stop at the end of this prompt and verify everything boots before running prompt 2.**

---

Initialize a Turborepo monorepo for MWRD with 4 apps and 4 shared packages.

## Step 1 — Create the monorepo

```bash
npx create-turbo@latest mwrd-platform --package-manager npm
cd mwrd-platform
rm -rf apps/web apps/docs   # remove default starter apps
```

## Step 2 — Create the 3 web apps

```bash
cd apps
for app in client supplier backoffice; do
  npx create-next-app@latest $app \
    --typescript --tailwind --app --src-dir=false \
    --import-alias="@/*" --eslint --no-turbopack
done
```

## Step 3 — Create the mobile app (Expo)

```bash
npx create-expo-app@latest mobile --template tabs
cd mobile
npx expo install expo-router expo-localization expo-secure-store \
  react-native-safe-area-context react-native-screens
cd ../..
```

## Step 4 — Create shared packages

```bash
mkdir -p packages/shared/src/{types,validations,utils,data,constants}
mkdir -p packages/auth-public/src/{components,actions,utils}
mkdir -p packages/ui-web/src/components
mkdir -p packages/ui-mobile/src/components
mkdir -p packages/config
```

## Step 5 — `packages/shared/package.json`

```json
{
  "name": "@mwrd/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.8",
    "date-fns": "^3.6.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.8",
    "typescript": "^5.4.5"
  }
}
```

## Step 6 — `packages/auth-public/package.json`

```json
{
  "name": "@mwrd/auth-public",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@mwrd/shared": "*",
    "zod": "^3.23.8",
    "react-hook-form": "^7.51.5",
    "@hookform/resolvers": "^3.6.0"
  }
}
```

## Step 7 — Add workspace dependencies to apps

In `apps/client/package.json`, `apps/supplier/package.json`, `apps/mobile/package.json` add:

```json
"@mwrd/shared": "*",
"@mwrd/auth-public": "*"
```

In `apps/backoffice/package.json` add ONLY:

```json
"@mwrd/shared": "*"
```

**NEVER add `@mwrd/auth-public` to backoffice. This is intentional.**

## Step 8 — Configure shadcn/ui in each web app

```bash
for app in client supplier backoffice; do
  cd apps/$app && npx shadcn@latest init -d --yes && cd ../..
done
```

## Step 9 — Install dependencies in web apps

In each of `apps/client`, `apps/supplier`, `apps/backoffice` run:

```bash
npm install zod react-hook-form @hookform/resolvers \
  @tanstack/react-query next-intl @react-pdf/renderer lucide-react
```

## Step 10 — Install dependencies in mobile

In `apps/mobile` run:

```bash
npm install zod react-hook-form @hookform/resolvers \
  @tanstack/react-query nativewind
npm install --save-dev tailwindcss
npx tailwindcss init
```

## Step 11 — Update `turbo.json`

Configure pipelines for `build`, `dev`, `lint`, `type-check` across all apps.
Configure ports: `client=3000`, `supplier=3001`, `backoffice=3002`.

## Step 12 — Add a root `README.md`

Document: how to start each app, where shared code lives, the Phase 1 rule (all data flows through `packages/shared/src/data`), the auth split rule (`auth-public` for client+supplier+mobile, separate auth in backoffice), and the seed user credentials.

## Verification

From the root, `npm run dev` should start all 3 web apps and Expo bundler.

- `apps/client` at `localhost:3000` → hello world
- `apps/supplier` at `localhost:3001` → hello world
- `apps/backoffice` at `localhost:3002` → hello world
- `mobile`: Expo welcome screen on simulator

**STOP HERE. Confirm everything boots before proceeding to Prompt 2.**
