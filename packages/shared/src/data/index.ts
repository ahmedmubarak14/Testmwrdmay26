// THE SWAP POINT. All apps and packages call functions from here.
// Phase 1: in-memory store + seeded fixtures.
// Phase 2: replaced module-by-module with Supabase calls. Function signatures NEVER change.

import { seedAll } from "./seed";

export * from "./auth";
export * from "./catalog";
export * from "./offers";
export * from "./cart";
export * from "./rfq";
export * from "./awarding";
export * from "./approvals";
export * from "./account";
export * from "./orders";
export * from "./admin";
export * from "./notifications";

// Re-export the store reset helper for tests only.
export { resetStore } from "./store";
export { seedAll } from "./seed";

// Auto-seed on first import. Idempotent: if users already exist (e.g. test
// reset already ran seed), this no-ops.
import { store } from "./store";
if (store.users.size === 0) {
  seedAll();
}
