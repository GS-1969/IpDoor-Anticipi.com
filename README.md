# Pianificazione Incassi Settimanali

Web app Next.js per la pianificazione degli incassi previsti per cliente, settimana e mese.
Replica fedelmente il foglio Excel originale (anagrafica clienti via ODBC, matrice settimanale, raggruppamento mensile, riepiloghi) in un'interfaccia web pronta per il deploy su Vercel.

## Funzionalità

- **Griglia clienti × 52 settimane** con subtotali mensili automatici
- **Raggruppamento per mese collassabile**: clicca un mese per nascondere le settimane e vedere solo il subtotale
- **Anagrafica clienti via API**: route `/api/clients` con punto di integrazione ODBC chiaramente documentato (SQL Server, MySQL, Oracle, IBM iSeries/AS400)
- **Riepilogo** per cliente e per mese con grafico a barre
- **Salvataggio automatico** su `localStorage` (zero configurazione DB per partire)
- **TypeScript end-to-end** + Tailwind CSS

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

## Avvio locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Deploy su Vercel

### Opzione 1: via Git (consigliata)

1. Crea un repository GitHub e push del codice:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin git@github.com:tuo-utente/incassi-app.git
   git push -u origin main
   ```
2. Su [vercel.com](https://vercel.com): **Add New → Project** → seleziona il repository → **Deploy**. Nessuna configurazione necessaria, Vercel rileva Next.js automaticamente.

### Opzione 2: via CLI

```bash
npm i -g vercel
vercel              # primo deploy (preview)
vercel --prod       # deploy in produzione
```

## Collegare il database aziendale (sostituire il mock)

L'anagrafica clienti è servita dalla route `app/api/clients/route.ts`. Attualmente restituisce dati mock; per collegare un database reale, sostituisci il corpo di `GET()`:

### SQL Server / MySQL / PostgreSQL (driver Node nativo)

```bash
npm i mssql           # SQL Server
npm i mysql2          # MySQL/MariaDB
npm i pg              # PostgreSQL
```

```ts
import sql from "mssql";

export async function GET() {
  const pool = await sql.connect(process.env.DB_CONN_STRING!);
  const result = await pool.request().query(`
    SELECT CodCliente, RagioneSociale, PartitaIVA, Citta,
           Telefono, Email, Attivo
    FROM   Clienti
    WHERE  Attivo = 1
    ORDER  BY RagioneSociale
  `);
  return NextResponse.json(result.recordset.map(row => ({
    codCliente:     row.CodCliente,
    ragioneSociale: row.RagioneSociale,
    partitaIVA:     row.PartitaIVA,
    citta:          row.Citta,
    telefono:       row.Telefono,
    email:          row.Email,
    attivo:         row.Attivo === 1,
  })));
}
```

### IBM iSeries / AS400 (DB2 for i via ODBC)

```bash
npm i odbc
```

```ts
import odbc from "odbc";

export async function GET() {
  const conn = await odbc.connect(process.env.AS400_CONN_STRING!);
  const rows = await conn.query<any>(`
    SELECT CODCLI, RAGSOC, PIVA, CITTA, TELEF, EMAIL, ATTIVO
    FROM   LIBRERIA.ANACLI
    WHERE  ATTIVO = 'S'
    ORDER  BY RAGSOC
    FETCH FIRST 500 ROWS ONLY
  `);
  await conn.close();
  return NextResponse.json(rows.map(r => ({
    codCliente:     r.CODCLI?.trim(),
    ragioneSociale: r.RAGSOC?.trim(),
    partitaIVA:     r.PIVA?.trim(),
    citta:          r.CITTA?.trim(),
    telefono:       r.TELEF?.trim(),
    email:          r.EMAIL?.trim(),
    attivo:         r.ATTIVO === "S",
  })));
}
```

Esempio di stringa di connessione AS400:
```
DRIVER={IBM i Access ODBC Driver};SYSTEM=as400.azienda.local;UID=APP_USER;PWD=***;DATABASE=PRODDB;
```

### Variabili d'ambiente su Vercel

Le credenziali vanno configurate in **Settings → Environment Variables** del progetto Vercel, **mai nel codice**. Esempi:

| Nome                  | Valore                                                |
| --------------------- | ----------------------------------------------------- |
| `DB_CONN_STRING`      | `Server=...;Database=...;User Id=...;Password=...;`   |
| `AS400_CONN_STRING`   | `DRIVER={IBM i Access ODBC Driver};SYSTEM=...;...`    |

### Nota importante su Vercel + reti private

Le funzioni serverless di Vercel girano sul cloud pubblico e **non possono raggiungere reti aziendali on-premise** direttamente. Per un AS400 interno servono:

- un **endpoint REST/proxy** esposto su Internet che faccia da gateway al DB,
- oppure **Vercel Secure Compute** / VPN add-on (piani Enterprise),
- oppure una **replica del DB su servizio gestito** (Neon, Supabase, PlanetScale, AWS RDS) alimentata da un job di sincronizzazione periodica.

L'integrazione ODBC diretta funziona bene in **self-hosting** (Docker, server aziendale) oppure su piattaforme che permettono accesso a reti private.

## Persistenza dei forecast

Attualmente gli importi inseriti sono salvati su `localStorage` del browser. Vantaggio: zero configurazione, funziona offline. Limite: i dati sono per dispositivo e non condivisi.

Per renderli persistenti e condivisi, aggiungere una seconda API route `/api/forecasts` (GET, POST) collegata a un database. Opzioni consigliate per Vercel:

- **Vercel Postgres** (zero-config, generosa free tier)
- **Vercel KV** (Redis, per chiave-valore)
- **Supabase** / **Neon** (Postgres gestito esterno)

Modificare `lib/storage.ts` per chiamare l'API invece di `localStorage`.

## Struttura del progetto

```
app/
  api/clients/route.ts    # API anagrafica (punto di integrazione ODBC)
  clienti/page.tsx        # Vista anagrafica
  riepilogo/page.tsx      # Riepilogo per cliente e per mese
  page.tsx                # Foglio principale (griglia incassi)
  layout.tsx              # Layout root con nav
  globals.css             # Stili Tailwind
components/
  ForecastGrid.tsx        # Griglia clienti × settimane con grouping
  Nav.tsx                 # Navigazione superiore
lib/
  types.ts                # Tipi TypeScript condivisi
  weeks.ts                # Calcoli ISO week + mapping mese
  storage.ts              # Wrapper localStorage
  format.ts               # Formattazione valuta (€, it-IT)
```

## Licenza

Uso interno — adatta liberamente.
