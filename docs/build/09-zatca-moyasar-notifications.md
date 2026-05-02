# Prompt 9 — ZATCA Phase 2 + Moyasar + notifications (Phase 3)

> **Note:** Tap Payments has been replaced with **Moyasar** as the payment gateway for MWRD. Moyasar's onboarding is faster than Tap's and the API is simpler for SAR/mada/Apple Pay/STC Pay flows.

---

Wire ZATCA Phase 2 invoicing, Moyasar payments, real email/push notifications. Replace stubs with real implementations.

## ZATCA Phase 2

### Step 1 — Credentials

Apply for production CCSID and PCSID via ZATCA Fatoora portal. Store certificates in Supabase secrets, **NEVER in code**.

### Step 2 — Replace `zatca.ts` stub

`packages/shared/src/utils/zatca.ts` becomes:

- `generateZatcaTLV(invoice, seller)`: real TLV builder
  - Tag 1: seller name
  - Tag 2: VAT registration number
  - Tag 3: timestamp
  - Tag 4: total amount with VAT
  - Tag 5: VAT amount
  - Tag 6: hash of XML invoice
  - Tag 7: ECDSA signature
  - Tag 8: ECDSA public key
  - Tag 9: ECDSA signature of public key
  - Returns base64-encoded TLV.
- `signInvoiceXml(invoice)`: builds UBL 2.1 XML, signs with PCSID.
- `submitToFatoora(signedXml)`: calls Fatoora reporting/clearance API.
- `generateQrPng(tlv)`: renders QR code as PNG, returns base64.

### Step 3 — Edge function

`supabase/functions/zatca-submit/index.ts`:

- Triggered when Invoice is generated.
- Calls `signInvoiceXml` + `submitToFatoora`.
- Updates `Invoice.zatca_uuid`, `Invoice.zatca_qr`.
- On error: sets `Invoice.status='draft'` and notifies finance.

### Step 4 — Update Invoice PDF

`@react-pdf/renderer` Invoice template renders QR code from `Invoice.zatca_qr` in the bottom-right of every invoice.

## Moyasar Payments

### Step 1 — Merchant account

Apply for Moyasar merchant account at [moyasar.com](https://moyasar.com). Get publishable key and secret key. Store secret in Supabase secrets.

### Step 2 — Replace `payments.ts` stub

`packages/shared/src/utils/payments.ts` becomes:

```ts
createPaymentIntent(invoiceId, amount, payment_method):
  // Calls Moyasar payments API:
  //   POST https://api.moyasar.com/v1/payments
  // Body:
  //   amount (in halalas, multiply SAR by 100),
  //   currency='SAR',
  //   description=invoice_number,
  //   callback_url=client.mwrd.io/orders/[id]?moyasar_callback=1,
  //   source = { type: 'creditcard' | 'applepay' | 'stcpay', ... },
  //   metadata: { invoice_id, client_company_id }
  // Returns { intent_id: moyasar_payment_id, status, redirect_url? }

capturePayment(paymentId):
  // Moyasar auto-captures by default — no-op unless using auth-only flow

refundPayment(paymentId, amount, reason):
  // POST https://api.moyasar.com/v1/payments/{id}/refund
```

### Step 3 — Webhook edge function

`supabase/functions/moyasar-webhook/index.ts`:

- Verifies Moyasar webhook signature (shared secret in headers).
- On `payment.paid`: `Invoice.status='paid'`, record `payment_intent_id`, fire `sendNotification` to client + supplier + finance.
- On `payment.failed`: `Invoice.status` remains, notify client to retry.
- On `payment.refunded`: handle refund flow, notify finance.

### Step 4 — Client checkout flow

In `/orders/[id]`, when `status='delivered'` and `invoice.status='issued'`, show "Pay Invoice" button. Clicking:

1. Calls `createPaymentIntent`
2. Renders Moyasar.js card form (or redirects to Moyasar-hosted page for Apple Pay / STC Pay)
3. On submit, Moyasar processes payment
4. On callback: poll for invoice status update via `getInvoice()`

Supported payment methods: **mada**, Visa/Mastercard, **Apple Pay**, **STC Pay**.

## Email + push notifications

### Step 1 — Resend setup

Sign up for Resend. Verify `mwrd.io` domain. Get API key. Store in Supabase secrets.

### Step 2 — Email templates

Create React Email templates in `packages/shared/src/email-templates/`:

- `registration-thank-you.tsx`
- `callback-completed-activation.tsx`
- `internal-user-invitation.tsx`
- `rfq-received-supplier.tsx`
- `auto-quote-pending-review.tsx`
- `quote-received-client.tsx`
- `product-addition-request-approved.tsx`
- `product-addition-request-rejected.tsx`
- `offer-approved-supplier.tsx`
- `order-confirmed.tsx`
- `order-shipped.tsx`
- `invoice-issued.tsx`
- `payment-received.tsx`
- `approval-request.tsx` (when CPO enters approval chain)

All bilingual (en + ar) with RTL where applicable.

### Step 3 — Replace `sendNotification` stub

`packages/shared/src/utils/notifications.ts` becomes:

```ts
sendNotification(userId, type, title, body, link?):
  // 1. Insert Notification row (in-app)
  // 2. Look up user.email and user.push_token
  // 3. Call Resend with appropriate template
  // 4. If push_token: call Expo push API
```

Wire from Supabase edge functions, not from web/mobile clients (clients should never have notification credentials).

### Step 4 — Mobile push token registration

On mobile app foreground, register token via `expo-notifications`. Save to `user.push_token` via authenticated RPC call.

## Verification

- Generate an Invoice on a delivered CPO. Verify ZATCA TLV is created and QR appears on PDF.
- Submit invoice to Fatoora sandbox. Verify `zatca_uuid` stored.
- Click "Pay Invoice" as client. Moyasar payment form loads. Complete test payment with mada test card. Verify `invoice.status='paid'` after webhook fires.
- Sign up new client. Verify thank-you email arrives via Resend.
- Mark callback complete. Verify activation email arrives with working link.
- Submit RFQ. Verify all matched suppliers get supplier-side email.
- Approve a CPO. Verify approval-request emails go up the chain.
- Mobile: verify push notification arrives when a quote is sent to the client.
