// Payments adapter. MVP returns mock intent.
// Phase 3 wires Moyasar (https://moyasar.com/docs/api/).
// The signature MUST stay stable so swap-in is a no-op for callers.

import { v4 as uuid } from "uuid";

export interface PaymentIntent {
  intent_id: string;
  status: string;
}

export async function createPaymentIntent(
  _invoiceId: string,
  _amount: number,
  _payment_method: string,
): Promise<PaymentIntent> {
  return {
    intent_id: `mock_${uuid()}`,
    status: "requires_action",
  };
}
