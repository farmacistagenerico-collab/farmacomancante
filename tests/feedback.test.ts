import assert from "node:assert/strict";
import { test } from "node:test";
import { feedbackToCsv } from "../src/lib/db";
import type { Feedback } from "../src/lib/types";

function item(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 1,
    role: "medico",
    name: "Dott. Rossi",
    email: "rossi@example.it",
    city: "Brescia",
    region: null,
    ratingUseful: 5,
    ratingClarity: 4,
    ratingTrust: 3,
    recommend: "si",
    usedFeatures: ["Ricerca farmaco", "Semaforo delle carenze"],
    missing: null,
    comment: "Utile in studio",
    hidden: 0,
    createdAt: "2026-10-28T08:00:00.000Z",
    ...overrides,
  };
}

test("CSV: intestazione con BOM e separatore punto e virgola", () => {
  const csv = feedbackToCsv([]);
  assert.ok(csv.startsWith("\uFEFF"), "deve iniziare con il BOM per Excel");
  const header = csv.slice(1).split("\r\n")[0];
  assert.equal(header.split(";")[0], "id");
  assert.ok(header.includes("consiglierebbe"));
  assert.ok(header.includes("funzioni_usate"));
});

test("CSV: una riga per parere, con valori leggibili", () => {
  const csv = feedbackToCsv([item()]);
  const rows = csv.slice(1).split("\r\n");
  assert.equal(rows.length, 2, "intestazione + 1 parere");
  const cells = rows[1].split(";");
  assert.equal(cells[0], "1");
  assert.equal(cells[2], "medico");
  assert.equal(cells[7], "5");
  assert.equal(cells[10], "si");
  assert.equal(cells[11], "Ricerca farmaco | Semaforo delle carenze");
});

test("CSV: virgolette, punti e virgola e a capo restano dentro il campo", () => {
  const csv = feedbackToCsv([
    item({ comment: 'Nota con "virgolette"; e punto e virgola\nseconda riga' }),
  ]);
  const rows = csv.slice(1).split("\r\n");
  // L'a capo interno non deve creare righe nuove nel conteggio logico
  assert.equal(rows.length, 2, "il commento multi-riga resta su una riga CSV");
  assert.ok(rows[1].includes('"Nota con ""virgolette""; e punto e virgola'));
});

test("CSV: i valori mancanti restano celle vuote", () => {
  const csv = feedbackToCsv([item({ name: null, email: null, region: null, missing: null })]);
  const cells = csv.slice(1).split("\r\n")[1].split(";");
  assert.equal(cells[3], "", "nome");
  assert.equal(cells[4], "", "email");
  assert.equal(cells[5], "Brescia", "città presente");
  assert.equal(cells[6], "", "regione");
  assert.equal(cells[12], "", "cosa manca");
});

test("CSV: i pareri nascosti sono segnalati nell'export", () => {
  const csv = feedbackToCsv([item({ hidden: 1 })]);
  const cells = csv.slice(1).split("\r\n")[1].split(";");
  assert.equal(cells[cells.length - 1], "si");
});
