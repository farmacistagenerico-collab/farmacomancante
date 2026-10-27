// Parser CSV minimale compatibile RFC 4180 (separatore ';', virgolette raddoppiate, CRLF).
// NB: la stessa logica è replicata in scripts/import-csv.mjs (node senza loader TS).

export function parseCsv(text: string, delimiter = ";"): string[][] {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1); // rimozione BOM
  }
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** "28/07/2025" -> "2025-07-28"; valori vuoti/non validi -> null */
export function parseDateIT(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo}-${d}`;
}

/** Riduce spazi multipli e ripulisce le virgolette residue delle celle AIFA */
export function cleanCell(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = value
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .replace(/^['\s]+|['\s]+$/g, "")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Normalizza una stringa per la ricerca: maiuscole, senza accenti */
export function normalizeSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}
