import type { Client } from "@/lib/types";
import { headers } from "next/headers";

async function getClients(): Promise<Client[]> {
  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/clients`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export default async function ClientiPage() {
  const clients = await getClients();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Anagrafica Clienti</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Elenco dei clienti restituito dall'API <code className="text-[12px] bg-zinc-100 px-1.5 py-0.5 rounded">/api/clients</code>.
          In produzione la route esegue una query ODBC al database aziendale.
        </p>
      </div>

      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-brand-700 text-white">
            <tr>
              <Th>Cod. Cliente</Th>
              <Th>Ragione Sociale</Th>
              <Th>Partita IVA</Th>
              <Th>Città</Th>
              <Th>Telefono</Th>
              <Th>Email</Th>
              <Th className="text-center">Attivo</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {clients.map((c) => (
              <tr key={c.codCliente} className="hover:bg-zinc-50">
                <Td className="num font-medium text-zinc-900">{c.codCliente}</Td>
                <Td className="font-medium text-zinc-900">{c.ragioneSociale}</Td>
                <Td className="num text-zinc-600">{c.partitaIVA}</Td>
                <Td className="text-zinc-600">{c.citta}</Td>
                <Td className="num text-zinc-600">{c.telefono}</Td>
                <Td className="text-zinc-600">{c.email}</Td>
                <Td className="text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                    c.attivo ? "text-emerald-700" : "text-zinc-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      c.attivo ? "bg-emerald-500" : "bg-zinc-300"
                    }`} />
                    {c.attivo ? "Sì" : "No"}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Punto di integrazione ODBC</p>
        <p className="mt-1">
          I dati mostrati provengono da un mock in <code className="text-[12px] bg-white/60 px-1 rounded">app/api/clients/route.ts</code>.
          Per collegare il database aziendale (SQL Server, MySQL, Oracle, IBM iSeries/AS400),
          sostituire il body della funzione <code className="text-[12px] bg-white/60 px-1 rounded">GET()</code> con una query reale —
          le istruzioni complete e gli esempi di codice sono nel commento in testa al file.
        </p>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}
