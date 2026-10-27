import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { cleanCell, normalizeSearch, parseCsv, parseDateIT } from "./csv";
import { recordImportBatch } from "./db";
import type { ImportSummary } from "./types";

interface CsvDrug {
  aic: string;
  name: string;
  activeIngredient: string | null;
  formDosage: string | null;
  aicHolder: string | null;
  startDate: string | null;
  presumedEndDate: string | null;
  equivalentRaw: string | null;
  hasEquivalent: number | null;
  reasons: string | null;
  aifaSuggestions: string | null;
  aifaNote: string | null;
  reimbursementClass: string | null;
  atcCode: string | null;
  searchText: string;
}

/** Riconosce "Sì"/"Si" e "No" nella colonna Equivalente, anche con valori sporchi */
function normalizeEquivalent(raw: string | null): number | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase();
  if (v.startsWith("S")) return 1;
  if (v.startsWith("N")) return 0;
  return null;
}

/** Estrae la data "aggiornato al dd/mm/yyyy" dalle righe introduttive del CSV AIFA */
function extractListDate(rows: string[][]): string | null {
  for (const row of rows.slice(0, 5)) {
    const joined = row.join(" ");
    const m = joined.match(/aggiornato\s+al\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (m) return parseDateIT(m[1]);
  }
  return null;
}

export function parseAifaCsv(csvText: string): {
  listDate: string | null;
  drugs: CsvDrug[];
} {
  const rows = parseCsv(csvText);
  const listDate = extractListDate(rows);

  const headerIndex = rows.findIndex((r) => r[0]?.trim() === "Nome medicinale");
  if (headerIndex === -1) {
    throw new Error("Intestazione 'Nome medicinale' non trovata nel CSV");
  }
  const header = rows[headerIndex].map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);

  const idxAic = col("Codice AIC");
  const drugs: CsvDrug[] = [];

  for (const raw of rows.slice(headerIndex + 1)) {
    if (raw.length < 2 || !raw[idxAic]?.trim()) continue;

    const name = cleanCell(raw[col("Nome medicinale")]);
    const aic = raw[idxAic].trim();
    if (!name) continue;

    const activeIngredient = cleanCell(raw[col("Principio attivo")]);
    const formDosage = cleanCell(raw[col("Forma farmaceutica e dosaggio")]);
    const equivalentRaw = cleanCell(raw[col("Equivalente")]);

    const drug: CsvDrug = {
      aic,
      name,
      activeIngredient,
      formDosage,
      aicHolder: cleanCell(raw[col("Titolare AIC")]),
      startDate: parseDateIT(raw[col("Data inizio")]),
      presumedEndDate: parseDateIT(raw[col("Fine presunta")]),
      equivalentRaw,
      hasEquivalent: normalizeEquivalent(equivalentRaw),
      reasons: cleanCell(raw[col("Motivazioni")]),
      aifaSuggestions: cleanCell(raw[col("Suggerimenti/Indicazioni AIFA")]),
      aifaNote: cleanCell(raw[col("Nota AIFA")]),
      reimbursementClass: cleanCell(raw[col("Classe di rimborsabilità")]),
      atcCode: cleanCell(raw[col("Codice ATC")]),
      searchText: normalizeSearch(
        [name, activeIngredient ?? "", aic, raw[col("Codice ATC")] ?? ""].join(" ")
      ),
    };
    drugs.push(drug);
  }

  return { listDate, drugs };
}

export async function importCsv(
  db: DatabaseSync,
  csvPath: string
): Promise<ImportSummary> {
  const buffer = fs.readFileSync(csvPath);
  // Il file AIFA è codificato Windows-1252
  const csvText = new TextDecoder("windows-1252").decode(buffer);
  const { listDate, drugs } = parseAifaCsv(csvText);

  const existing = new Set(
    (db.prepare("SELECT aic FROM drug").all() as unknown as { aic: string }[]).map(
      (r) => r.aic
    )
  );

  const upsert = db.prepare(
    `INSERT INTO drug
       (aic, name, active_ingredient, form_dosage, aic_holder, start_date,
        presumed_end_date, equivalent_raw, has_equivalent, reasons,
        aifa_suggestions, aifa_note, reimbursement_class, atc_code, search_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(aic) DO UPDATE SET
       name = excluded.name,
       active_ingredient = excluded.active_ingredient,
       form_dosage = excluded.form_dosage,
       aic_holder = excluded.aic_holder,
       start_date = excluded.start_date,
       presumed_end_date = excluded.presumed_end_date,
       equivalent_raw = excluded.equivalent_raw,
       has_equivalent = excluded.has_equivalent,
       reasons = excluded.reasons,
       aifa_suggestions = excluded.aifa_suggestions,
       aifa_note = excluded.aifa_note,
       reimbursement_class = excluded.reimbursement_class,
       atc_code = excluded.atc_code,
       search_text = excluded.search_text`
  );

  let inserted = 0;
  let updated = 0;
  db.exec("BEGIN");
  try {
    for (const d of drugs) {
      upsert.run(
        d.aic,
        d.name,
        d.activeIngredient,
        d.formDosage,
        d.aicHolder,
        d.startDate,
        d.presumedEndDate,
        d.equivalentRaw,
        d.hasEquivalent,
        d.reasons,
        d.aifaSuggestions,
        d.aifaNote,
        d.reimbursementClass,
        d.atcCode,
        d.searchText
      );
      if (existing.has(d.aic)) updated++;
      else inserted++;
    }
    recordImportBatch(path.basename(csvPath), listDate, drugs.length);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return {
    sourceFile: path.basename(csvPath),
    listDate,
    importedAt: new Date().toISOString(),
    totalRows: drugs.length,
    inserted,
    updated,
  };
}
