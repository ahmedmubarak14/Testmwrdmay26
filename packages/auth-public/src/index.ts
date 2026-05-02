// @mwrd/auth-public — auth code shared by client + supplier + mobile ONLY.
// NEVER imported by apps/backoffice. Backoffice has its own separate auth.
// Phase 2: Supabase Auth tokens issued here use the public `aud` claim;
// backoffice middleware rejects them.

export {};
