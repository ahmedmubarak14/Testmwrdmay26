// Verification script for the @mwrd/shared package.
// Run with: npx tsx packages/shared/test.ts

import {
  resetStore,
  seedAll,
  signIn,
  listMasterProducts,
  registerPublic,
  markCallbackComplete,
  activateAccount,
  createRFQ,
  listQuotesForSupplier,
  listAdminHeldQuotes,
  setDirectApprover,
  tickAutoSend,
  setMargin,
} from "./src/data";
import { store } from "./src/data/store";

let failures = 0;
function check(label: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failures += 1;
  }
}

async function expectThrows(label: string, fn: () => Promise<unknown> | unknown): Promise<void> {
  try {
    await fn();
    check(label, false, "expected to throw, did not");
  } catch {
    check(label, true);
  }
}

async function main(): Promise<void> {
  // ─── Reset and re-seed deterministically ─────────────────────────────────
  resetStore();
  const seeds = seedAll();

  console.log("Sign-in (3 seeded users)");
  const clientSession = await signIn({ email: "client@mwrd.com", password: "client123" });
  check("client signed in", clientSession.user.email === "client@mwrd.com");
  const supplierSession = await signIn({ email: "supplier@mwrd.com", password: "supplier123" });
  check("supplier signed in", supplierSession.user.email === "supplier@mwrd.com");
  const adminSession = await signIn({ email: "admin@mwrd.com", password: "admin123" });
  check("admin signed in", adminSession.user.role === "admin");

  console.log("Master products");
  const products = await listMasterProducts({ page: 1, page_size: 25 });
  check(
    `total >= 200 (got ${products.total})`,
    products.total >= 200,
  );

  console.log("Public registration lifecycle");
  const newUser = await registerPublic({
    email: "newleadtest@example.com",
    real_name: "Lead Test",
    phone: "+966500009999",
    role: "client",
    company_real_name: "Lead Co",
    signup_intent: "Test registration",
    expected_monthly_volume_sar: 5000,
    language: "en",
  });
  check("registerPublic -> pending_callback", newUser.status === "pending_callback");
  check("registerPublic has no password record", !store.passwords.has(newUser.id));

  const afterCallback = await markCallbackComplete(newUser.id, "rang back twice");
  check(
    "markCallbackComplete -> activation_token set",
    typeof afterCallback.activation_token === "string" &&
      afterCallback.activation_token.startsWith("act_"),
  );
  check("markCallbackComplete -> callback_completed", afterCallback.status === "callback_completed");

  const activated = await activateAccount({
    activation_token: afterCallback.activation_token!,
    password: "newPassw0rd",
  });
  check("activateAccount -> active", activated.status === "active");
  check("activateAccount cleared token", activated.activation_token === null);
  const newSession = await signIn({
    email: "newleadtest@example.com",
    password: "newPassw0rd",
  });
  check("post-activation sign-in works", newSession.user.id === activated.id);

  console.log("Auto-quote engine: small RFQ");
  const allProducts = Array.from(store.master_products.values()).slice(0, 2);
  // Force a low margin so the small RFQ stays under the admin-hold threshold.
  await setMargin({
    scope: "global",
    pct: 5,
    updated_by_user_id: seeds.admin_user_id,
  });

  const smallRFQ = await createRFQ({
    client_company_id: seeds.client_company_id,
    created_by_user_id: seeds.client_user_id,
    title: "Small auto RFQ",
    description: "Test RFQ for auto-quote engine",
    category_id: null,
    delivery_city: "Riyadh",
    delivery_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    source: "catalog",
    items: allProducts.map((mp) => ({
      master_product_id: mp.id,
      description: mp.description_en,
      qty: 2,
      unit: mp.default_unit,
      pack_type: mp.pack_types[0] ?? "Each",
    })),
  });

  const acmeQuotes = await listQuotesForSupplier(seeds.supplier_company_id);
  const acmeForRFQ = acmeQuotes.filter((q) => q.rfq_id === smallRFQ.id);
  check(
    `Acme has at least one auto-draft for the new RFQ (got ${acmeForRFQ.length})`,
    acmeForRFQ.length >= 1,
  );

  // Move time forward and tick the auto-send queue.
  const future = new Date(Date.now() + 4 * 3600 * 1000);
  await tickAutoSend(future);
  const acmeAfter = (await listQuotesForSupplier(seeds.supplier_company_id)).filter(
    (q) => q.rfq_id === smallRFQ.id,
  );
  const submittedSmall = acmeAfter.filter((q) => q.status === "submitted_to_client");
  check(
    `small RFQ auto-quote routed to client (got ${submittedSmall.length})`,
    submittedSmall.length >= 1,
  );

  console.log("Auto-quote engine: large RFQ -> admin hold");
  // Big quantities + 50% margin to push above the 25k SAR threshold.
  await setMargin({
    scope: "global",
    pct: 50,
    updated_by_user_id: seeds.admin_user_id,
  });
  const largeRFQ = await createRFQ({
    client_company_id: seeds.client_company_id,
    created_by_user_id: seeds.client_user_id,
    title: "Large RFQ",
    description: "Should get held for admin review",
    category_id: null,
    delivery_city: "Riyadh",
    delivery_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    source: "catalog",
    items: allProducts.map((mp) => ({
      master_product_id: mp.id,
      description: mp.description_en,
      qty: 10_000,
      unit: mp.default_unit,
      pack_type: mp.pack_types[0] ?? "Each",
    })),
  });
  await tickAutoSend(new Date(Date.now() + 4 * 3600 * 1000));
  const heldQuotes = await listAdminHeldQuotes();
  const heldForLarge = heldQuotes.filter((q) => q.rfq_id === largeRFQ.id);
  check(
    `large RFQ auto-quote routed to admin hold (got ${heldForLarge.length})`,
    heldForLarge.length >= 1,
  );

  console.log("Approval cycle detection");
  // Build chain A->B->C, then attempt to set C's approver to A.
  const memberA = "user-a";
  const memberB = "user-b";
  const memberC = "user-c";
  const cyCompany = seeds.client_company_id;

  await setDirectApprover({
    company_id: cyCompany,
    member_user_id: memberA,
    direct_approver_user_id: memberB,
  });
  await setDirectApprover({
    company_id: cyCompany,
    member_user_id: memberB,
    direct_approver_user_id: memberC,
  });
  await expectThrows("cycle rejected when C -> A would close the loop", () =>
    setDirectApprover({
      company_id: cyCompany,
      member_user_id: memberC,
      direct_approver_user_id: memberA,
    }),
  );
  await expectThrows("self-approver rejected", () =>
    setDirectApprover({
      company_id: cyCompany,
      member_user_id: memberA,
      direct_approver_user_id: memberA,
    }),
  );

  console.log("");
  if (failures > 0) {
    console.error(`FAILED: ${failures} check(s) did not pass`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

main().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});
