// Document number generators. Format defined in CLAUDE.md.

export type DocPrefix = "CPO" | "SPO" | "DN" | "GRN" | "INV" | "RFQ" | "Q";

const sequenceCounters: Map<string, number> = new Map();

function nextSeq(key: string): number {
  const current = sequenceCounters.get(key) ?? 0;
  const next = current + 1;
  sequenceCounters.set(key, next);
  return next;
}

function todayDateStamp(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function generateDocNumber(prefix: DocPrefix, now: Date = new Date()): string {
  const date = todayDateStamp(now);
  const key = `${prefix}-${date}`;
  const seq = String(nextSeq(key)).padStart(4, "0");
  return `MWRD-${prefix}-${date}-${seq}`;
}

export function generateMasterProductCode(seq: number): string {
  return `MWRD-PROD-${String(seq).padStart(5, "0")}`;
}
