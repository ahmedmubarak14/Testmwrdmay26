# Prompt 3 — Public auth package (client + supplier shared)

Build the shared auth surface mounted on both client and supplier domains. **NOT used by backoffice.**

---

Build `packages/auth-public` — the shared authentication surface for clients and suppliers. This package is imported by `apps/client`, `apps/supplier`, and `apps/mobile`. It is NEVER imported by `apps/backoffice`.

## Package structure

```
packages/auth-public/
├── src/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ThankYouCard.tsx
│   │   ├── ActivateForm.tsx
│   │   ├── OnboardingWizard.tsx
│   │   └── AuthLayout.tsx
│   ├── actions/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   ├── activate.ts
│   │   └── onboarding.ts
│   ├── utils/
│   │   ├── role-redirect.ts    // determines target URL by role
│   │   └── session.ts          // cookie/secure-store helpers
│   └── index.ts
└── package.json
```

## Login form (`LoginForm.tsx`)

- Centered card on `AuthLayout`
- Header: MWRD logo, "Sign in to MWRD"
- Fields: Email, Password
- "Forgot password?" link (placeholder in MVP — opens dialog with "Contact support@mwrd.io to reset")
- "Don't have an account? Register" link below button
- Submit calls `signIn()` from `@mwrd/shared/data`
- On success:
  - if `user.role === 'client'`: redirect to `/dashboard` on `client.mwrd.io`
  - if `user.role === 'supplier'`: redirect to `/dashboard` on `supplier.mwrd.io`
  - if `user.role IN admin/ops/finance/cs`: show error "Backoffice users must sign in at backoffice.mwrd.io. This URL is for clients and suppliers only." (NO redirect helpfully provided.)
  - if `user.activation_status !== 'activated'`: show error "Account not activated. Check your email for the activation link."
  - if `user.onboarding_completed === false`: redirect to `/onboarding`

## Register form (`RegisterForm.tsx`)

- Centered card. Header: "Create your MWRD account"
- **Step 1: Account type toggle** — two large cards side by side:
  - `[Client]` "I want to source goods" / `[Supplier]` "I want to sell goods"
  - User clicks one. Selection sets `account_type`.
- **Step 2: Minimal info form** (single screen, all required):
  - Full Name (`real_name`), Email, Phone (+966 country code prefix, validates format), Company Name (`real_name` for company)
  - `[Submit]` button
- Submit calls `registerPublic()` with full payload + `account_type`
- On success: redirect to `/register/thank-you`
- Footer: "Already have an account? Sign in" link

## `ThankYouCard.tsx`

- Centered card. Header: "Thanks for signing up"
- Body:
  > "We received your registration. Our team will call you on [phone last 4 digits] within 24 hours to verify your details."
  > "Once verified, you'll receive an activation email to set your password."
  > "Questions? Email support@mwrd.io."
- Single CTA: `[Back to home]` → mwrd.io

## `ActivateForm.tsx` (mounted at `/activate?token=xxx`)

- Reads `?token` query param
- On mount: validates token by calling `getCurrentUserByToken` or similar
  - If invalid: show "This activation link is invalid or expired."
  - If valid: show password creation form
- Form: New Password, Confirm Password, Terms checkbox
- Password rules: 8+ chars, mixed case, 1 number
- Submit calls `activateAccount(token, password)`
- On success: store `sessionToken`, redirect to `/onboarding`

## `OnboardingWizard.tsx` (mounted at `/onboarding` on each app)

Multi-step (3 steps):

- **Step 1 — "About your company"**
  - CR Number (Saudi Commercial Registration), VAT Number
  - Business Address (full text)
  - `[Continue]`
- **Step 2 (clients only) — "Set up your team"**
  - "You can invite team members and configure roles now or later."
  - `[Skip for now]` `[Continue with setup]`
  - If continue: simplified user-roles-approval-tree mini-form
- **Step 2 (suppliers only) — "Categories you serve"**
  - Multi-select of the 8 categories
  - `[Continue]`
- **Step 3 — "You're done"**
  - "You can now start using MWRD."
  - `[Go to Dashboard]`

Submit on each step calls `completeOnboarding()` incrementally. Last step sets `onboarding_completed=true`.

## `role-redirect.ts`

```ts
export function getRedirectUrl(user: User, currentDomain: string): string | null
// Returns:
//   null if user can stay on currentDomain
//   absolute URL if user must be redirected to another domain
//   error path '/error?code=wrong_portal' if user role is backoffice
```

## `session.ts`

```ts
// Web: httpOnly cookie 'mwrd_session_public'
// Mobile: expo-secure-store key 'mwrd_session_public'
// Two implementations exported separately to avoid React Native
// in web bundles.
export function setPublicSession(token: string)
export function getPublicSession(): string | null
export function clearPublicSession()
```

## How apps mount auth-public

In `apps/client/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from '@mwrd/auth-public';
export default function Page() { return <LoginForm /> }
```

Same for `/register`, `/register/thank-you`, `/activate`, `/onboarding`.
Same in `apps/supplier`.
Same in `apps/mobile` (with native components — see Prompt 7).

## Middleware (in each web app)

`apps/client/middleware.ts`:

- Reads `mwrd_session_public` cookie
- If absent and route !in `(auth pages)`: redirect to `/login`
- If present: `getCurrentUser`. If `role !== 'client'`: redirect to `/error?code=wrong_portal`
- If `onboarding_completed === false` and route !== `/onboarding`: redirect to `/onboarding`

`apps/supplier/middleware.ts`: same pattern but role check is `'supplier'`.

## Verification

- Visit `client.mwrd.io/login` → sees `LoginForm`
- Visit `supplier.mwrd.io/login` → sees same `LoginForm` (shared)
- Sign in as `client@mwrd.com` on `supplier.mwrd.io/login` → redirects to `client.mwrd.io/dashboard`
- Sign in as `supplier@mwrd.com` on `client.mwrd.io/login` → redirects to `supplier.mwrd.io/dashboard`
- Try to sign in as `admin@mwrd.com` on `client.mwrd.io/login` → error, no helpful redirect to backoffice URL
- Register as a new client (Hassan, hassan@example.com, +966501234567, Acme Co): see thank-you page. User created with `status='pending_callback'`.
- Cannot sign in as the new user yet (no password set).
- (Skip backoffice activation for now — wire-up in Prompt 6.)
