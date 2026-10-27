#!/usr/bin/env node
/**
 * Adattatore fonte esterna: anagrafe ufficiale delle farmacie
 * (Ministero della Salute, open data, aggiornamento quotidiano).
 *
 * Dataset:  https://www.dati.salute.gov.it/it/dataset/farmacie/
 * Licenza:  Italian Open Data License v2.0
 *
 * Uso:
 *   node scripts/import-farmacie-mdm.mjs <file.csv|URL>
 *   npm run import:farmacie-mdm -- /percorso/farmacie.csv
 *
 * Il dataset espone, tra le altre, le colonne (i nomi reali possono variare
 * leggermente: il cerca-colonna sotto gestisce le varianti note):
 *   CODICEIDENTIFICATIVOFARMACIA, CODICEFARMACIAASSEGNATOASL, PARTITAIVA,
 *   DENOMINAZIONE, INDIRIZZO, CAP, COMUNE, PROVINCIA, REGIONE
 *
 * Le anagrafe confluiscono in external_signal e servono a validare
 * (codice ministeriale / P.IVA) le farmacie iscritte al portale.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT, "data", "farmacomancante.db");
const SOURCE_CODE = "mdm-farmacie";

const target = process.argv[2];
if (!target) {
  console.error("Uso: node scripts/import-farmacie-mdm.mjs <file.csv|URL>");
  console.error("Dataset: https://www.dati.salute.gov.it/it/dataset/farmacie/");
  process.exit(1);
}

function parseCsv(text, delimiter = ";") {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const findCol = (header, candidates) => {
  const normalized = header.map((h) => h.toUpperCase().replace(/\s+/g, ""));
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
};

async function loadText() {
  if (/^https?:\/\//.test(target)) {
    const res = await fetch(target);
    if (!res.ok) throw new Error(`Download fallito: HTTP ${res.status}`);
    return new TextDecoder("utf-8").decode(Buffer.from(await res.arrayBuffer()));
  }
  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) throw new Error(`File non trovato: ${resolved}`);
  return new TextDecoder("utf-8").decode(fs.readFileSync(resolved));
}

const text = await loadText();
const delimiter = text.split("\n")[0].includes(";") ? ";" : ",";
const rows = parseCsv(text, delimiter);
const headerIndex = rows.findIndex((r) => r.some((c) => /DENOMINAZIONE|FARMACIA/i.test(c)));
if (headerIndex === -1) throw new Error("Intestazione del dataset farmacie non riconosciuta");
const header = rows[headerIndex].map((h) => h.trim());

const cols = {
  code: findCol(header, ["CODICEIDENTIFICATIVOFARMACIA", "CODICEFARMACIA", "ID"]),
  asl: findCol(header, ["CODICEFARMACIAASSEGNATOASL", "CODICEASL"]),
  iva: findCol(header, ["PARTITAIVA", "PIVA"]),
  name: findCol(header, ["DENOMINAZIONEFARMACIA", "DENOMINAZIONE"]),
  address: findCol(header, ["INDIRIZZO", "VIA"]),
  cap: findCol(header, ["CAP"]),
  city: findCol(header, ["COMUNE", "DESCRIZIONECOMUNE"]),
  province: findCol(header, ["PROVINCIA", "SIGLAPROVINCIA"]),
  region: findCol(header, ["REGIONE", "DESCRIZIONEREGIONE"]),
};
if (cols.code === -1 || cols.name === -1) {
  throw new Error("Colonne obbligatorie (codice identificativo, denominazione) non trovate");
}

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode=WAL;");
db.exec(fs.readFileSync(path.join(ROOT, "src", "lib", "schema.sql"), "utf8"));

const upsert = db.prepare(
  `INSERT INTO external_signal (source_code, aic, subject, signal, payload_json, fetched_at)
   VALUES (?, NULL, ?, 'anagrafica', ?, ?)
   ON CONFLICT(source_code, aic, subject) DO UPDATE SET
     payload_json = excluded.payload_json,
     fetched_at = excluded.fetched_at`
);
const now = new Date().toISOString();
let count = 0;
db.exec("BEGIN");
try {
  for (const r of rows.slice(headerIndex + 1)) {
    const subject = r[cols.code]?.trim();
    const name = r[cols.name]?.trim();
    if (!subject || !name) continue;
    const payload = {
      denominazione: name,
      codiceAsl: cols.asl >= 0 ? r[cols.asl]?.trim() || null : null,
      partitaIva: cols.iva >= 0 ? r[cols.iva]?.trim() || null : null,
      indirizzo: cols.address >= 0 ? r[cols.address]?.trim() || null : null,
      cap: cols.cap >= 0 ? r[cols.cap]?.trim() || null : null,
      comune: cols.city >= 0 ? r[cols.city]?.trim() || null : null,
      provincia: cols.province >= 0 ? r[cols.province]?.trim() || null : null,
      regione: cols.region >= 0 ? r[cols.region]?.trim() || null : null,
    };
    upsert.run(SOURCE_CODE, subject, JSON.stringify(payload), now);
    count++;
  }
  db.prepare(
    `INSERT INTO external_source (code, name, description, kind, last_sync_at, last_status)
     VALUES (?, 'Ministero della Salute — Anagrafe farmacie (open data)', NULL, 'external', ?, 'ok')
     ON CONFLICT(code) DO UPDATE SET last_sync_at = excluded.last_sync_at,
       last_status = excluded.last_status`
  ).run(SOURCE_CODE, now);
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

console.log(`✓ Anagrafe farmacie MDM importata: ${count} record in external_signal`);
db.close();
