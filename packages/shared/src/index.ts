// @mwrd/shared — single source of truth for types, validations, utils, data, constants.
// Phase 1 rule: ALL data flows through this package. Components/pages NEVER call fetch() or supabase.from() directly.
// Phase 2 will replace ./data with Supabase calls behind the same interface.

export * from "./types";
export * as validations from "./validations";
export * as data from "./data";

// Utility namespaces (named to avoid collision with type names).
export * as aliases from "./utils/aliases";
export * as margins from "./utils/margins";
export * as numbers from "./utils/numbers";
export * as zatca from "./utils/zatca";
export * as threeWayMatch from "./utils/three-way-match";
export * as payments from "./utils/payments";
export * as approvalChain from "./utils/approval-chain";
export * as autoQuote from "./utils/auto-quote";
