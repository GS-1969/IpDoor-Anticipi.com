"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { Client, ForecastStore, Month } from "@/lib/types";
import { buildMonths, formatMonday, isoWeeksInYear, weekLabel } from "@/lib/weeks";
import { amountKey, loadStore, saveStore } from "@/lib/storage";
import { formatEUR, parseAmount } from "@/lib/format";

type Props = {
  clients: Client[];
};

const COL_W_WEEK = "min-w-[88px] w-[88px]";
const COL_W_MONTH = "min-w-[104px] w-[104px]";
const COL_W_TOTAL = "min-w-[124px] w-[124px]";
const COL_W_CLIENT = "min-w-[240px] w-[240px]";

export default function ForecastGrid({ clients }: Props) {
  const [year, setYear] = useState<number>(2026);
  const [store, setStore] = useState<ForecastStore>({ amounts: {}, rows: [] });
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage once on mount
  useEffect(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  // persist on every change (after hydration so we don't overwrite with empty)
  useEffect(() => {
    if (hydrated) saveStore(store);
  }, [store, hydrated]);

  const months: Month[] = useMemo(() => buildMonths(year), [year]);
  const totalWeeks = useMemo(() => isoWeeksInYear(year), [year]);

  const clientByCode = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => m.set(c.codCliente, c));
    return m;
  }, [clients]);

  // resolve display rows: keep store order, drop ones that no longer exist in anagrafica
  const rows = useMemo(
    () => store.rows.filter((code) => clientByCode.has(code)),
    [store.rows, clientByCode]
  );

  const setAmount = useCallback(
    (codCliente: string, week: number, value: number | null) => {
      setStore((prev) => {
        const next = { ...prev, amounts: { ...prev.amounts } };
        const k = amountKey(codCliente, year, week);
        if (value == null || value === 0) delete next.amounts[k];
        else next.amounts[k] = value;
        return next;
      });
    },
    [year]
  );

  const addRow = useCallback(
    (code: string) => {
      if (!code) return;
      setStore((prev) => {
        if (prev.rows.includes(code)) return prev;
        return { ...prev, rows: [...prev.rows, code] };
      });
    },
    []
  );

  const removeRow = useCallback((code: string) => {
    setStore((prev) => {
      const newAmounts: Record<string, number> = {};
      Object.entries(prev.amounts).forEach(([k, v]) => {
        if (!k.startsWith(`${code}::`)) newAmounts[k] = v;
      });
      return { rows: prev.rows.filter((c) => c !== code), amounts: newAmounts };
    });
  }, []);

  const toggleMonth = useCallback((m: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }, []);

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(months.map((m) => m.index)));

  // Computations
  const getAmount = (code: string, w: number) =>
    store.amounts[amountKey(code, year, w)] ?? 0;

  const monthSubtotalForClient = (code: string, m: Month) => {
    let s = 0;
    for (let w = m.firstWeek; w <= m.lastWeek; w++) s += getAmount(code, w);
    return s;
  };
  const rowTotalForClient = (code: string) =>
    months.reduce((acc, m) => acc + monthSubtotalForClient(code, m), 0);

  const weekTotal = (w: number) =>
    rows.reduce((acc, c) => acc + getAmount(c, w), 0);

  const monthTotal = (m: Month) =>
    rows.reduce((acc, c) => acc + monthSubtotalForClient(c, m), 0);

  const grandTotal = months.reduce((acc, m) => acc + monthTotal(m), 0);

  // Available clients to add (not already in the grid)
  const addableClients = clients.filter((c) => !rows.includes(c.codCliente));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-4 bg-white border border-zinc-200 rounded-lg px-4 py-3">
        <div className="flex items-end gap-6">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">
              Anno
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || "2026", 10))}
              className="w-24 h-9 rounded-md border border-zinc-300 px-3 text-sm num focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <AddClientControl
            options={addableClients}
            onAdd={(code) => addRow(code)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={expandAll} title="Mostra tutte le settimane">
            Espandi mesi
          </button>
          <button className="btn" onClick={collapseAll} title="Mostra solo i subtotali mensili">
            Comprimi mesi
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <span className="chip-input">Input manuale</span>
        <span className="chip-month">Subtotale mese</span>
        <span className="chip-total">Totale</span>
        <span className="ml-auto text-xs text-zinc-500 self-center">
          Dati salvati automaticamente nel browser.
        </span>
      </div>

      {/* Grid */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Month header row */}
            <div className="flex sticky top-0 z-30">
              <div className={`${COL_W_CLIENT} h-8 bg-brand-800 border-r border-brand-900 flex items-center px-3`}>
                <span className="text-white text-[11px] font-semibold uppercase tracking-wider">
                  Periodo
                </span>
              </div>
              {months.map((m) => {
                const isCollapsed = collapsed.has(m.index);
                const weekCount = m.lastWeek - m.firstWeek + 1;
                const spanWidth = isCollapsed ? 0 : weekCount;
                return (
                  <div key={m.index} className="flex" style={{}}>
                    {/* weeks span */}
                    <div
                      className="cell-monthhdr"
                      onClick={() => toggleMonth(m.index)}
                      style={{
                        width: `calc(${spanWidth} * 88px + 104px)`,
                        minWidth: `calc(${spanWidth} * 88px + 104px)`,
                      }}
                      title={isCollapsed ? "Espandi mese" : "Comprimi mese"}
                    >
                      <span className="mr-1.5 text-white/80">
                        {isCollapsed ? "▸" : "▾"}
                      </span>
                      {m.name}
                    </div>
                  </div>
                );
              })}
              <div className={`${COL_W_TOTAL} h-8 bg-brand-900 border-r border-brand-900 flex items-center justify-center`}>
                <span className="text-white text-[11px] font-semibold uppercase tracking-wider">
                  Annuo
                </span>
              </div>
            </div>

            {/* Column header row (S01.. + GEN/FEB/.. + Totale) */}
            <div className="flex sticky top-8 z-30">
              <div className={`${COL_W_CLIENT} cell-header border-l border-brand-800 justify-start pl-3`}>
                Cliente
              </div>
              {months.map((m) => (
                <MonthColumnsHeader
                  key={m.index}
                  month={m}
                  collapsed={collapsed.has(m.index)}
                />
              ))}
              <div className={`${COL_W_TOTAL} cell-header bg-brand-900 border-r-0`}>
                Totale Cliente
              </div>
            </div>

            {/* Date subheader row (Monday of each week) */}
            <div className="flex sticky top-[68px] z-20">
              <div className={`${COL_W_CLIENT} cell-datesub bg-zinc-100 justify-start pl-3 text-zinc-500`}>
                Lun. settimana
              </div>
              {months.map((m) => (
                <MonthDatesRow
                  key={m.index}
                  month={m}
                  year={year}
                  collapsed={collapsed.has(m.index)}
                />
              ))}
              <div className={`${COL_W_TOTAL} cell-datesub bg-zinc-100`}>—</div>
            </div>

            {/* Data rows */}
            {rows.length === 0 ? (
              <EmptyState />
            ) : (
              rows.map((code) => {
                const client = clientByCode.get(code)!;
                return (
                  <div key={code} className="flex group">
                    <ClientCell client={client} onRemove={() => removeRow(code)} />
                    {months.map((m) => (
                      <MonthRowCells
                        key={m.index}
                        month={m}
                        collapsed={collapsed.has(m.index)}
                        getAmount={(w) => getAmount(code, w)}
                        setAmount={(w, v) => setAmount(code, w, v)}
                        subtotal={monthSubtotalForClient(code, m)}
                      />
                    ))}
                    <div className={`${COL_W_TOTAL} cell-rowtotal`}>
                      {formatEUR(rowTotalForClient(code))}
                    </div>
                  </div>
                );
              })
            )}

            {/* Totals row */}
            {rows.length > 0 && (
              <div className="flex sticky bottom-0 z-20">
                <div className={`${COL_W_CLIENT} cell-coltotal text-left pl-3 justify-start flex items-center font-semibold uppercase tracking-wide text-[12px]`}>
                  Totale settimana
                </div>
                {months.map((m) => (
                  <MonthTotalsRow
                    key={m.index}
                    month={m}
                    collapsed={collapsed.has(m.index)}
                    weekTotal={weekTotal}
                    monthTotal={monthTotal(m)}
                  />
                ))}
                <div className={`${COL_W_TOTAL} cell-grand`}>
                  {formatEUR(grandTotal)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function MonthColumnsHeader({ month, collapsed }: { month: Month; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className={`${COL_W_MONTH} cell-header bg-brand-800`}>
        {month.abbr}
      </div>
    );
  }
  return (
    <>
      {Array.from({ length: month.lastWeek - month.firstWeek + 1 }, (_, i) => {
        const w = month.firstWeek + i;
        return (
          <div key={w} className={`${COL_W_WEEK} cell-header`}>
            {weekLabel(w)}
          </div>
        );
      })}
      <div className={`${COL_W_MONTH} cell-header bg-brand-800`}>
        {month.abbr}
      </div>
    </>
  );
}

function MonthDatesRow({ month, year, collapsed }: { month: Month; year: number; collapsed: boolean }) {
  if (collapsed) {
    return <div className={`${COL_W_MONTH} cell-datesub bg-zinc-100`}>—</div>;
  }
  return (
    <>
      {Array.from({ length: month.lastWeek - month.firstWeek + 1 }, (_, i) => {
        const w = month.firstWeek + i;
        return (
          <div key={w} className={`${COL_W_WEEK} cell-datesub`}>
            {formatMonday(year, w)}
          </div>
        );
      })}
      <div className={`${COL_W_MONTH} cell-datesub bg-zinc-100`}>—</div>
    </>
  );
}

function MonthRowCells({
  month,
  collapsed,
  getAmount,
  setAmount,
  subtotal,
}: {
  month: Month;
  collapsed: boolean;
  getAmount: (w: number) => number;
  setAmount: (w: number, v: number | null) => void;
  subtotal: number;
}) {
  if (collapsed) {
    return (
      <div className={`${COL_W_MONTH} cell-month`}>
        {formatEUR(subtotal)}
      </div>
    );
  }
  return (
    <>
      {Array.from({ length: month.lastWeek - month.firstWeek + 1 }, (_, i) => {
        const w = month.firstWeek + i;
        return (
          <AmountCell
            key={w}
            value={getAmount(w)}
            onChange={(v) => setAmount(w, v)}
          />
        );
      })}
      <div className={`${COL_W_MONTH} cell-month`}>
        {formatEUR(subtotal)}
      </div>
    </>
  );
}

function MonthTotalsRow({
  month,
  collapsed,
  weekTotal,
  monthTotal,
}: {
  month: Month;
  collapsed: boolean;
  weekTotal: (w: number) => number;
  monthTotal: number;
}) {
  if (collapsed) {
    return (
      <div className={`${COL_W_MONTH} cell-grand`}>
        {formatEUR(monthTotal)}
      </div>
    );
  }
  return (
    <>
      {Array.from({ length: month.lastWeek - month.firstWeek + 1 }, (_, i) => {
        const w = month.firstWeek + i;
        return (
          <div key={w} className={`${COL_W_WEEK} cell-coltotal`}>
            {formatEUR(weekTotal(w))}
          </div>
        );
      })}
      <div className={`${COL_W_MONTH} cell-grand`}>
        {formatEUR(monthTotal)}
      </div>
    </>
  );
}

function AmountCell({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number | null) => void;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));
  const lastSyncedValue = useRef(value);

  // re-sync display when external value changes (e.g. year switch)
  useEffect(() => {
    if (value !== lastSyncedValue.current) {
      setText(value === 0 ? "" : String(value));
      lastSyncedValue.current = value;
    }
  }, [value]);

  const commit = () => {
    const parsed = parseAmount(text);
    onChange(parsed);
    lastSyncedValue.current = parsed ?? 0;
    setText(parsed == null || parsed === 0 ? "" : String(parsed));
  };

  return (
    <div className={`${COL_W_WEEK} cell-input`}>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        placeholder="—"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}

function ClientCell({
  client,
  onRemove,
}: {
  client: Client;
  onRemove: () => void;
}) {
  return (
    <div className={`${COL_W_CLIENT} cell-label flex items-center justify-between gap-2 sticky left-0 z-10 bg-white`}>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-zinc-900">
          {client.ragioneSociale}
        </div>
        <div className="truncate text-[11px] text-zinc-500 num">
          {client.codCliente} · {client.citta}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-rose-600 text-lg px-1"
        title="Rimuovi riga"
        aria-label="Rimuovi cliente dalla griglia"
      >
        ×
      </button>
    </div>
  );
}

function AddClientControl({
  options,
  onAdd,
}: {
  options: Client[];
  onAdd: (code: string) => void;
}) {
  const [value, setValue] = useState("");
  const disabled = options.length === 0;
  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="block text-[11px] font-medium text-zinc-500 mb-1 uppercase tracking-wide">
          Aggiungi cliente alla griglia
        </label>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 min-w-[280px] rounded-md border border-zinc-300 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-50"
        >
          <option value="">
            {disabled ? "Tutti i clienti già presenti" : "Seleziona dall'anagrafica…"}
          </option>
          {options.map((c) => (
            <option key={c.codCliente} value={c.codCliente}>
              {c.ragioneSociale}
            </option>
          ))}
        </select>
      </div>
      <button
        className="btn-primary h-9"
        disabled={!value}
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
      >
        + Aggiungi
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex">
      <div className="flex-1 py-14 px-6 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-base font-semibold text-zinc-900">
            Nessun cliente in griglia
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Seleziona un cliente dall'anagrafica per iniziare a inserire gli incassi previsti.
          </p>
        </div>
      </div>
    </div>
  );
}
