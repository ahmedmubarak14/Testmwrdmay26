// Anonymity rule: every public user gets a platform alias used everywhere
// the counterparty might see them. Aliases are immutable.

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SUPPLIER_COLOURS = [
  "Violet",
  "Indigo",
  "Teal",
  "Amber",
  "Coral",
  "Sage",
  "Rose",
  "Slate",
] as const;

export function generateClientAlias(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
  }
  return `Client-${suffix}`;
}

export function generateSupplierAlias(takenAliases: string[]): string {
  const taken = new Set(takenAliases);
  for (const colour of SUPPLIER_COLOURS) {
    const candidate = `Supplier ${colour}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Pool exhausted — append a number, smallest unused.
  for (let n = 2; n < 10_000; n++) {
    for (const colour of SUPPLIER_COLOURS) {
      const candidate = `Supplier ${colour} ${n}`;
      if (!taken.has(candidate)) return candidate;
    }
  }
  throw new Error("Supplier alias pool exhausted beyond reasonable bounds");
}
