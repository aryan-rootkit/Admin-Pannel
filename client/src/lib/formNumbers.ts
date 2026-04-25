const inrDecimal = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  useGrouping: true,
});

/** Keep digits and at most one decimal point (commas stripped). */
export function normalizeDecimalInput(raw: string): string {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, "")}`;
}

/** Parse a normalized decimal string; empty or invalid → null. */
export function parseDecimalString(normalized: string): number | null {
  if (normalized === "" || normalized === ".") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function formatDecimalInr(n: number): string {
  return inrDecimal.format(n);
}
