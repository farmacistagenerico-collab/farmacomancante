import fs from "node:fs";
import { bundledCsvPath } from "../paths";
import { AIFA_CSV_URL } from "./registry";

export interface AifaCsvResult {
  csvText: string;
  source: "remote" | "local";
}

/**
 * Recupera la lista carenti direttamente dal sito AIFA (URL pubblico stabile).
 * In caso di assenza di rete o errore, ricade sul CSV archiviato in data/raw,
 * così l'import funziona anche in ambienti disconnessi (es. sviluppo offline).
 */
export async function fetchAifaCsv(timeoutMs = 20000): Promise<AifaCsvResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(AIFA_CSV_URL, {
      signal: controller.signal,
      headers: { Accept: "text/csv, application/octet-stream, */*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`AIFA ha risposto ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return { csvText: new TextDecoder("windows-1252").decode(buffer), source: "remote" };
  } catch (err) {
    const localCsv = bundledCsvPath();
    if (!localCsv) {
      throw new Error(
        `Impossibile scaricare la lista AIFA e nessun CSV locale disponibile: ${
          (err as Error).message
        }`
      );
    }
    const buffer = fs.readFileSync(localCsv);
    return { csvText: new TextDecoder("windows-1252").decode(buffer), source: "local" };
  }
}
