export type Client = {
  codCliente: string;
  ragioneSociale: string;
  partitaIVA: string;
  citta: string;
  telefono: string;
  email: string;
  attivo: boolean;
};

/**
 * Forecast data is stored as a flat record indexed by `${codCliente}::${year}::W${ww}`.
 * Empty / missing weeks are simply absent from the record.
 */
export type ForecastEntry = {
  codCliente: string;
  year: number;
  week: number;   // 1..52
  amount: number; // EUR
};

export type ForecastStore = {
  /** key: `${codCliente}::${year}::W${ww}` → amount */
  amounts: Record<string, number>;
  /** ordered list of client codes currently shown on the grid */
  rows: string[];
};

export type Month = {
  index: number;        // 1..12
  name: string;         // Italian full name
  abbr: string;         // 3-letter code (GEN, FEB, …)
  firstWeek: number;    // first ISO week assigned to this month for the default year
  lastWeek: number;
};
