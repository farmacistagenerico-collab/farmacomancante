import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDrugStatus, STATUS_META } from "../src/lib/status";

test("la disponibilità concreta ha sempre la precedenza (verde)", () => {
  assert.equal(
    computeDrugStatus({
      availabilityCount: 1,
      mancanteCount: 5,
      risoluzioneCount: 0,
      presumedEndDate: null,
    }),
    "disponibile"
  );
});

test("una segnalazione di risoluzione porta al giallo anche senza disponibilità", () => {
  assert.equal(
    computeDrugStatus({
      availabilityCount: 0,
      mancanteCount: 3,
      risoluzioneCount: 1,
      presumedEndDate: null,
    }),
    "risoluzione"
  );
});

test("la fine presunta AIFA trascorsa porta al giallo", () => {
  assert.equal(
    computeDrugStatus({
      availabilityCount: 0,
      mancanteCount: 0,
      risoluzioneCount: 0,
      presumedEndDate: "2020-01-01",
    }),
    "risoluzione"
  );
});

test("senza alcun segnale positivo resta rosso", () => {
  assert.equal(
    computeDrugStatus({
      availabilityCount: 0,
      mancanteCount: 2,
      risoluzioneCount: 0,
      presumedEndDate: "2099-01-01",
    }),
    "carenza"
  );
  assert.equal(
    computeDrugStatus({
      availabilityCount: 0,
      mancanteCount: 0,
      risoluzioneCount: 0,
      presumedEndDate: null,
    }),
    "carenza"
  );
});

test("esistono sempre tutti e tre i metadati del semaforo", () => {
  assert.deepEqual(Object.keys(STATUS_META).sort(), [
    "carenza",
    "disponibile",
    "risoluzione",
  ]);
});
