import path from "node:path";
import fs from "node:fs";

/**
 * Percorsi dei dati persistenti.
 *
 * In sviluppo conviene la cartella `data/` del repository; in produzione
 * (container, Render, Fly, VPS) si monta un volume e si indica il percorso
 * con `FARMACOMANCANTE_DATA_DIR`, così il database sopravvive ai deploy.
 */
const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");

export function dataDir(): string {
  const configured = process.env.FARMACOMANCANTE_DATA_DIR?.trim();
  return configured ? path.resolve(configured) : DEFAULT_DATA_DIR;
}

export function dbPath(): string {
  return path.join(dataDir(), "farmacomancante.db");
}

export function rawCsvPath(): string {
  return path.join(dataDir(), "raw", "elenco_medicinali_carenti.csv");
}

export function secretPath(): string {
  return path.join(dataDir(), "secret.key");
}

/** Schema SQL: in produzione viene copiato accanto al server standalone. */
export function schemaPath(): string {
  const candidates = [
    path.join(process.cwd(), "src", "lib", "schema.sql"),
    path.join(process.cwd(), "schema.sql"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `schema.sql non trovato (cercato in: ${candidates.join(", ")}). ` +
      "Verifica che il file sia incluso nel pacchetto di deploy."
  );
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Copia del CSV AIFA inclusa nel pacchetto di deploy.
 * Serve al primo avvio su un volume vuoto (container, PaaS): permette di
 * popolare il database anche se la rete non è ancora disponibile.
 */
export function bundledCsvPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "assets", "elenco_medicinali_carenti.csv"),
    path.join(process.cwd(), "data", "raw", "elenco_medicinali_carenti.csv"),
    path.join(dataDir(), "raw", "elenco_medicinali_carenti.csv"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
