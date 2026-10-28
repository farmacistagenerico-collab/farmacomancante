import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSiteUrl } from "../src/lib/site";

test("URL: aggiunge https quando manca lo schema", () => {
  assert.equal(normalizeSiteUrl("farmacomancante.it"), "https://farmacomancante.it");
});

test("URL: rimuove gli slash finali", () => {
  assert.equal(normalizeSiteUrl("https://farmacomancante.it/"), "https://farmacomancante.it");
  assert.equal(normalizeSiteUrl("https://farmacomancante.it///"), "https://farmacomancante.it");
});

test("URL: lascia intatto un http esplicito (ambiente locale)", () => {
  assert.equal(normalizeSiteUrl("http://localhost:3000"), "http://localhost:3000");
  assert.equal(normalizeSiteUrl("http://localhost:3000/"), "http://localhost:3000");
});

test("URL: schema in maiuscolo non viene raddoppiato", () => {
  assert.equal(normalizeSiteUrl("HTTPS://esempio.it"), "HTTPS://esempio.it");
});

test("URL: spazi accidentali vengono ignorati", () => {
  assert.equal(normalizeSiteUrl("  https://esempio.it/  "), "https://esempio.it");
});

test("URL: valore vuoto ricade sul default di sviluppo", () => {
  assert.equal(normalizeSiteUrl("   "), "http://localhost:3000");
});

test("URL: mantiene il percorso se il sito è servito in sottocartella", () => {
  assert.equal(normalizeSiteUrl("https://esempio.it/farmaci/"), "https://esempio.it/farmaci");
});
