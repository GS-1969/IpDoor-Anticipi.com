const formatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEUR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || value === 0) return "—";
  return formatter.format(value);
}

/** Parse an Italian-style number input (accepts "1.234,56" or "1234.56"). */
export function parseAmount(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  // strip currency symbol and spaces
  const clean = s.replace(/€|\s/g, "");
  // detect Italian format (comma as decimal)
  if (clean.includes(",") && clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
    const normalized = clean.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}
