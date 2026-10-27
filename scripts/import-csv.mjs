#!/usr/bin/env node
/**
 * Importazione/aggiornamento della lista AIFA dei farmaci carenti.
 *
 * Uso:
 *   npm run import                          # usa data/raw/elenco_medicinali_carenti.csv
 *   node scripts/import-csv.mjs <file.csv>  # usa un CSV personalizzato
 *
 * Script autonomo (JS ESM, senza dipendenze TS): la logica di parsing è
 * volutamente allineata a src/lib/csv.ts e src/lib/import.ts.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.join(ROOT, "data", "farmacomancante.db");
const DEFAULT_CSV = path.join(ROOT, "data", "raw", "elenco_medicinali_carenti.csv");
const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CSV;

function parseCsv(text, delimiter = ";") {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
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

const clean = (v) => {
  if (v === null || v === undefined) return null;
  const c = v
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .replace(/^['\s]+|['\s]+$/g, "")
    .trim();
  return c.length ? c : null;
};
const parseDate = (v) => {
  if (!v) return null;
  const m = v.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const normSearch = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const normEquivalent = (v) => {
  if (!v) return null;
  const u = v.trim().toUpperCase();
  if (u.startsWith("S")) return 1;
  if (u.startsWith("N")) return 0;
  return null;
};

if (!fs.existsSync(csvPath)) {
  console.error(`File non trovato: ${csvPath}`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const csvText = new TextDecoder("windows-1252").decode(fs.readFileSync(csvPath));
const rows = parseCsv(csvText);

let listDate = null;
for (const r of rows.slice(0, 5)) {
  const m = r.join(" ").match(/aggiornato\s+al\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (m) {
    listDate = parseDate(m[1]);
    break;
  }
}

const headerIndex = rows.findIndex((r) => r[0]?.trim() === "Nome medicinale");
if (headerIndex === -1) throw new Error("Intestazione 'Nome medicinale' non trovata");
const header = rows[headerIndex].map((h) => h.trim());
const col = (name) => header.indexOf(name);

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
db.exec(fs.readFileSync(path.join(ROOT, "src", "lib", "schema.sql"), "utf8"));

const existing = new Set(
  db.prepare("SELECT aic FROM drug").all().map((r) => r.aic)
);
const upsert = db.prepare(
  `INSERT INTO drug
     (aic, name, active_ingredient, form_dosage, aic_holder, start_date,
      presumed_end_date, equivalent_raw, has_equivalent, reasons,
      aifa_suggestions, aifa_note, reimbursement_class, atc_code, search_text)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(aic) DO UPDATE SET
     name=excluded.name, active_ingredient=excluded.active_ingredient,
     form_dosage=excluded.form_dosage, aic_holder=excluded.aic_holder,
     start_date=excluded.start_date, presumed_end_date=excluded.presumed_end_date,
     equivalent_raw=excluded.equivalent_raw, has_equivalent=excluded.has_equivalent,
     reasons=excluded.reasons, aifa_suggestions=excluded.aifa_suggestions,
     aifa_note=excluded.aifa_note, reimbursement_class=excluded.reimbursement_class,
     atc_code=excluded.atc_code, search_text=excluded.search_text`
);

let inserted = 0;
let updated = 0;
const now = new Date().toISOString();
db.exec("BEGIN");
try {
  for (const raw of rows.slice(headerIndex + 1)) {
    const aic = raw[col("Codice AIC")]?.trim();
    const name = clean(raw[col("Nome medicinale")]);
    if (!aic || !name) continue;
    const activeIngredient = clean(raw[col("Principio attivo")]);
    const equivalentRaw = clean(raw[col("Equivalente")]);
    upsert.run(
      aic,
      name,
      activeIngredient,
      clean(raw[col("Forma farmaceutica e dosaggio")]),
      clean(raw[col("Titolare AIC")]),
      parseDate(raw[col("Data inizio")]),
      parseDate(raw[col("Fine presunta")]),
      equivalentRaw,
      normEquivalent(equivalentRaw),
      clean(raw[col("Motivazioni")]),
      clean(raw[col("Suggerimenti/Indicazioni AIFA")]),
      clean(raw[col("Nota AIFA")]),
      clean(raw[col("Classe di rimborsabilità")]),
      clean(raw[col("Codice ATC")]),
      normSearch([name, activeIngredient ?? "", aic, raw[col("Codice ATC")] ?? ""].join(" "))
    );
    if (existing.has(aic)) updated++;
    else inserted++;
  }
  db.prepare(
    "INSERT INTO import_batch (source_file, list_date, imported_at, row_count) VALUES (?, ?, ?, ?)"
  ).run(path.basename(csvPath), listDate, now, inserted + updated);
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

console.log("✓ Importazione completata");
console.log(`  file:        ${path.basename(csvPath)}`);
console.log(`  lista del:   ${listDate ?? "n/d"}`);
console.log(`  inseriti:    ${inserted}`);
console.log(`  aggiornati:  ${updated}`);
db.close();
