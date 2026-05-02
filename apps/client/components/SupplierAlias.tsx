// Resolves supplier company id -> platform_alias.
// CLAUDE.md anonymity rule: NEVER expose supplier real_name to client.

import { data } from "@mwrd/shared";

const aliasCache = new Map<string, string>();

export async function resolveSupplierAlias(supplier_company_id: string): Promise<string> {
  const cached = aliasCache.get(supplier_company_id);
  if (cached) return cached;
  // Look up via any user belonging to that supplier (each supplier has same alias).
  const all = await data.listAllUsers();
  const u = all.find((x) => x.company_id === supplier_company_id);
  const alias = u?.platform_alias ?? "Supplier";
  aliasCache.set(supplier_company_id, alias);
  return alias;
}
