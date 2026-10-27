import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanCell, normalizeSearch, parseCsv, parseDateIT } from "../src/lib/csv";

test("parseCsv gestisce separatore, virgolette raddoppiate e CRLF", () => {
  const csv = 'A;B;C\r\n"x;y";"Virgolette ""quoted""";semplice\r\n';
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ["x;y", 'Virgolette "quoted"', "semplice"]);
});

test("parseCsv gestisce il BOM e campi vuoti", () => {
  const rows = parseCsv("\uFEFFNome;Codice\r\n;001\r\n");
  assert.equal(rows[0][0], "Nome");
  assert.deepEqual(rows[1], ["", "001"]);
});

test("parseDateIT converte nel formato ISO e scarta i valori sporchi", () => {
  assert.equal(parseDateIT("28/07/2025"), "2025-07-28");
  assert.equal(parseDateIT(""), null);
  assert.equal(parseDateIT("inizio carenza: 07/02/2024"), null);
});

test("cleanCell rimuove virgolette residue e compatta gli spazi", () => {
  assert.equal(cleanCell('  "  10 MG   COMPRESSE " '), "10 MG COMPRESSE");
  assert.equal(cleanCell("   "), null);
  assert.equal(cleanCell(null), null);
});

test("normalizeSearch elimina accenti e maiuscole", () => {
  assert.equal(normalizeSearch("Amoxicillina  acido"), "AMOXICILLINA ACIDO");
  assert.equal(normalizeSearch("OLANZAPINA"), "OLANZAPINA");
});
