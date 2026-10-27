import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../src/lib/rate-limit";

test("blocca oltre la soglia nella finestra temporale", () => {
  const key = `test-${Math.random()}`;
  const first = rateLimit(key, 3, 60_000);
  assert.equal(first.ok, true);
  assert.equal(first.remaining, 2);
  assert.equal(rateLimit(key, 3, 60_000).ok, true);
  assert.equal(rateLimit(key, 3, 60_000).ok, true);
  const blocked = rateLimit(key, 3, 60_000);
  assert.equal(blocked.ok, false);
  assert.ok((blocked.retryAfterSeconds ?? 0) > 0);
});

test("chiavi diverse hanno contatori separati", () => {
  assert.equal(rateLimit(`a-${Math.random()}`, 1, 60_000).ok, true);
  assert.equal(rateLimit(`b-${Math.random()}`, 1, 60_000).ok, true);
});
