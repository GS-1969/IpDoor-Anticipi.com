import type { ForecastStore } from "./types";

const KEY = "incassi:v1";

const EMPTY: ForecastStore = { amounts: {}, rows: [] };

export function loadStore(): ForecastStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ForecastStore>;
    return {
      amounts: parsed.amounts ?? {},
      rows: parsed.rows ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveStore(store: ForecastStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // quota exceeded or disabled — silently ignore for the demo
  }
}

export function amountKey(codCliente: string, year: number, week: number): string {
  return `${codCliente}::${year}::W${String(week).padStart(2, "0")}`;
}
