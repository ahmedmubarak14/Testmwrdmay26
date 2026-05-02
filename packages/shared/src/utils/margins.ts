// Margin engine. SERVER-ONLY logic.
// Client-facing API responses NEVER include margin_pct or supplier_cost.
// Supplier-facing API responses NEVER include final_price or margin.
// Resolution order: client > category > global.

import type { Margin, ID } from "../types";

export function applyMargin(supplier_cost: number, margin_pct: number): number {
  const result = supplier_cost * (1 + margin_pct / 100);
  return Math.round(result * 100) / 100;
}

export function resolveMargin(
  margins: Margin[],
  category_id: ID,
  client_company_id: ID,
): number {
  const clientMargin = margins.find(
    (m) => m.scope === "client" && m.scope_id === client_company_id,
  );
  if (clientMargin) return clientMargin.pct;

  const categoryMargin = margins.find(
    (m) => m.scope === "category" && m.scope_id === category_id,
  );
  if (categoryMargin) return categoryMargin.pct;

  const globalMargin = margins.find((m) => m.scope === "global");
  if (globalMargin) return globalMargin.pct;

  throw new Error("No global margin configured");
}
