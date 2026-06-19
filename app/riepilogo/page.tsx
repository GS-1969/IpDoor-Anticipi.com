"use client";

import { useEffect, useMemo, useState } from "react";
import type { Client, ForecastStore, Month } from "@/lib/types";
import { amountKey, loadStore } from "@/lib/storage";
import { buildMonths } from "@/lib/weeks";
import { formatEUR } from "@/lib/format";

export default function RiepilogoPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [store, setStore] = useState<ForecastStore>({ amounts: {}, rows: [] });
  const [year, setYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStore(loadStore());
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => setClients(data))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const months: Month[] = useMemo(() => buildMonths(year), [year]);

  const clientByCode = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => m.set(c.codCliente, c));
    return m;
  }, [clients]);

  const rows = useMemo(
    () => store.rows.filter((code) => clientByCode.has(code)),
    [store.rows, clientByCode]
  );

  const totalByClient = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((code) => {
      let s = 0;
      months.forEach((m) => {
        for (let w = m.firstWeek; w <= m.lastWeek; w++) {
          s += store.amounts[amountKey(code, year, w)] ?? 0;
        }
      });
      map[code] = s;
    });
    return map;
  }, [rows, months, store.amounts, year]);

  const totalByMonth = useMemo(() => {
    return months.map((m) => {
      let s = 0;
      rows.forEach((code) => {
        for (let w = m.firstWeek; w <= m.lastWeek; w++) {
          s += store.amounts[amountKey(code, year, w)] ?? 0;
        }
      });
      return { month: m, total: s };
    });
  }, [months, rows, store.amounts, year]);

  const grandTotalClient = Object.values(totalByClient).reduce((a, b) => a + b, 0);
  const grandTotalMonth = totalByMonth.reduce((a, b) => a + b.total, 0);
  const maxMonth = Math.max(1, ...totalByMonth.map((m) => m.total));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Riepilogo</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Totali per cliente e per mese, calcolati dai dati inseriti nel foglio principale.
          </p>
        </div>
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
      </div>

      {!loading && rows.length === 0 ? (
        <div className="border border-dashed border-zinc-300 rounded-lg p-10 text-center bg-white">
          <p className="text-zinc-600">
            Nessun dato da riepilogare. Aggiungi clienti e importi nel foglio <a className="text-brand-700 underline" href="/">Incassi Settimanali</a>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Totals by client */}
          <section className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
            <header className="bg-brand-700 text-white px-4 py-2.5">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Totale per cliente</h2>
            </header>
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Cliente
                  </th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Totale annuo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((code) => {
                  const c = clientByCode.get(code)!;
                  return (
                    <tr key={code} className="hover:bg-zinc-50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-zinc-900">{c.ragioneSociale}</div>
                        <div className="text-[11px] text-zinc-500 num">{c.codCliente}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right num font-medium">
                        {formatEUR(totalByClient[code])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-brand-800 text-white">
                <tr>
                  <td className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider">
                    Totale complessivo
                  </td>
                  <td className="px-4 py-2.5 text-right num font-bold">
                    {formatEUR(grandTotalClient)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Totals by month with bars */}
          <section className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
            <header className="bg-brand-700 text-white px-4 py-2.5">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Totale per mese</h2>
            </header>
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Mese
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Andamento
                  </th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Totale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {totalByMonth.map(({ month, total }) => (
                  <tr key={month.index} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-medium text-zinc-900">
                      {month.name}
                    </td>
                    <td className="px-4 py-2.5 w-[55%]">
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${(total / maxMonth) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right num font-medium">
                      {formatEUR(total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-brand-800 text-white">
                <tr>
                  <td className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" colSpan={2}>
                    Totale anno
                  </td>
                  <td className="px-4 py-2.5 text-right num font-bold">
                    {formatEUR(grandTotalMonth)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
