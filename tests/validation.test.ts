import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCap,
  validateEmail,
  validateFutureDate,
  validatePassword,
  validateProvince,
  validateReporterRole,
  validateShortageSignal,
} from "../src/lib/validation";

test("email", () => {
  assert.equal(validateEmail("m@farmacia.it"), null);
  assert.ok(validateEmail("no-email"));
  assert.ok(validateEmail(""));
});

test("password minimo 8 caratteri", () => {
  assert.equal(validatePassword("12345678"), null);
  assert.ok(validatePassword("1234567"));
});

test("CAP e provincia", () => {
  assert.equal(validateCap("25019"), null);
  assert.ok(validateCap("2501"));
  assert.equal(validateProvince("bs"), null);
  assert.ok(validateProvince("Lombardia"));
});

test("data futura", () => {
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  assert.equal(validateFutureDate(tomorrow), null);
  assert.ok(validateFutureDate("2020-01-01"));
  assert.ok(validateFutureDate(""));
});

test("ruoli e segnali delle segnalazioni", () => {
  assert.equal(validateReporterRole("medico"), null);
  assert.ok(validateReporterRole("hacker"));
  assert.equal(validateShortageSignal("risoluzione"), null);
  assert.ok(validateShortageSignal("rosso"));
});
