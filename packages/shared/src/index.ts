// @mwrd/shared — single source of truth for types, validations, utils, data, constants.
// Phase 1 rule: ALL data flows through this package. Components/pages NEVER call fetch() or supabase.from() directly.
// Phase 2 will replace ./data with Supabase calls behind the same interface.

export * from "./types";
