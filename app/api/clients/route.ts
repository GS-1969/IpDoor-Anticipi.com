import { NextResponse } from "next/server";
import type { Client } from "@/lib/types";

/**
 * ============================================================================
 *  PUNTO DI INTEGRAZIONE CON IL DATABASE AZIENDALE (ODBC / iSeries / SQL)
 * ============================================================================
 *
 *  Questa route restituisce l'anagrafica clienti che alimenta la dropdown
 *  del foglio "Pianificazione Incassi". Attualmente serve dati mock — quando
 *  si va in produzione, sostituire il body di `GET()` con una vera query.
 *
 *  ─── Opzione A: SQL Server / MySQL / Postgres (driver Node nativo) ────────
 *
 *    npm i mssql                  // SQL Server
 *    npm i mysql2                 // MySQL / MariaDB
 *    npm i pg                     // PostgreSQL
 *
 *    import sql from "mssql";
 *    const pool = await sql.connect(process.env.DB_CONN_STRING);
 *    const result = await pool.request().query(`
 *      SELECT CodCliente, RagioneSociale, PartitaIVA, Citta,
 *             Telefono, Email, Attivo
 *      FROM   Clienti
 *      WHERE  Attivo = 1
 *      ORDER  BY RagioneSociale
 *    `);
 *    return NextResponse.json(result.recordset.map(mapRow));
 *
 *  ─── Opzione B: IBM iSeries / AS400 (DB2 for i) ───────────────────────────
 *
 *    npm i odbc                                 // driver ODBC generico
 *
 *    import odbc from "odbc";
 *    const conn = await odbc.connect(process.env.AS400_CONN_STRING!);
 *    const rows = await conn.query(`
 *      SELECT CODCLI, RAGSOC, PIVA, CITTA, TELEF, EMAIL, ATTIVO
 *      FROM   LIBRERIA.ANACLI
 *      WHERE  ATTIVO = 'S'
 *      ORDER  BY RAGSOC
 *      FETCH FIRST 500 ROWS ONLY
 *    `);
 *    await conn.close();
 *    return NextResponse.json(rows.map(mapAS400Row));
 *
 *    Stringa di connessione esempio:
 *      DRIVER={IBM i Access ODBC Driver};SYSTEM=as400.azienda.local;
 *      UID=APP_USER;PWD=***;DATABASE=PRODDB;
 *
 *  ─── Nota su Vercel ───────────────────────────────────────────────────────
 *
 *  Le funzioni serverless Vercel non possono raggiungere reti aziendali
 *  private direttamente. Per AS400 on-prem servono:
 *    • un endpoint REST esposto su Internet (proxy), oppure
 *    • Vercel Secure Compute / VPN add-on, oppure
 *    • una replica del DB su servizio gestito (Neon, Supabase, PlanetScale)
 *      alimentata da un job di sincronizzazione periodica.
 *
 *  Le credenziali vanno in variabili d'ambiente su Vercel
 *  (Settings → Environment Variables), MAI nel codice.
 * ============================================================================
 */

const MOCK_CLIENTS: Client[] = [
  { codCliente: "CL001", ragioneSociale: "Alfa Costruzioni S.r.l.",       partitaIVA: "IT01234567890", citta: "Milano",  telefono: "02-1234567",  email: "info@alfacostruzioni.it",  attivo: true },
  { codCliente: "CL002", ragioneSociale: "Beta Servizi S.p.A.",           partitaIVA: "IT02345678901", citta: "Roma",    telefono: "06-2345678",  email: "amm@betaservizi.it",       attivo: true },
  { codCliente: "CL003", ragioneSociale: "Gamma Logistica S.r.l.",        partitaIVA: "IT03456789012", citta: "Torino",  telefono: "011-3456789", email: "ordini@gammalog.it",       attivo: true },
  { codCliente: "CL004", ragioneSociale: "Delta Manifatture S.r.l.",      partitaIVA: "IT04567890123", citta: "Bologna", telefono: "051-4567890", email: "vendite@deltamf.it",       attivo: true },
  { codCliente: "CL005", ragioneSociale: "Epsilon Distribuzione S.p.A.",  partitaIVA: "IT05678901234", citta: "Napoli",  telefono: "081-5678901", email: "info@epsilondist.it",      attivo: true },
  { codCliente: "CL006", ragioneSociale: "Zeta Engineering S.r.l.",       partitaIVA: "IT06789012345", citta: "Firenze", telefono: "055-6789012", email: "contatti@zetaeng.it",      attivo: true },
  { codCliente: "CL007", ragioneSociale: "Eta Trading S.r.l.",            partitaIVA: "IT07890123456", citta: "Genova",  telefono: "010-7890123", email: "trading@eta.it",           attivo: true },
  { codCliente: "CL008", ragioneSociale: "Theta Consulenze S.r.l.",       partitaIVA: "IT08901234567", citta: "Verona",  telefono: "045-8901234", email: "info@thetaconsulting.it",  attivo: true },
  { codCliente: "CL009", ragioneSociale: "Iota Forniture S.r.l.",         partitaIVA: "IT09012345678", citta: "Padova",  telefono: "049-9012345", email: "ordini@iotaforniture.it",  attivo: true },
  { codCliente: "CL010", ragioneSociale: "Kappa Impianti S.p.A.",         partitaIVA: "IT00123456780", citta: "Bari",    telefono: "080-0123456", email: "info@kappaimpianti.it",    attivo: true },
];

export async function GET() {
  // In produzione: sostituire con una query reale (vedi commento in testa).
  await new Promise((r) => setTimeout(r, 80)); // simula latenza DB
  return NextResponse.json(MOCK_CLIENTS, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
