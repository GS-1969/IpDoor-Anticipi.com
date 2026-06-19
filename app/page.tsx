import ForecastGrid from "@/components/ForecastGrid";
import type { Client } from "@/lib/types";
import { headers } from "next/headers";

async function getClients(): Promise<Client[]> {
  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/clients`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function Page() {
  const clients = await getClients();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Pianificazione Incassi Settimanali
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Inserisci gli importi previsti per cliente e settimana. Le colonne
            sono raggruppate per mese e collassabili.
          </p>
        </div>
      </div>
      <ForecastGrid clients={clients} />
    </div>
  );
}
