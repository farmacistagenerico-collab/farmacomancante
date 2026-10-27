import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDb, getPharmacyById } from "./db";
import type { Pharmacy } from "./types";

export const SESSION_COOKIE = "fm_session";
const SESSION_DAYS = 7;
const DATA_DIR = path.join(process.cwd(), "data");
const SECRET_PATH = path.join(DATA_DIR, "secret.key");

function getSecret(): string {
  if (process.env.FARMACOMANCANTE_SECRET) {
    return process.env.FARMACOMANCANTE_SECRET;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SECRET_PATH)) {
    fs.writeFileSync(SECRET_PATH, randomBytes(32).toString("hex"), { mode: 0o600 });
  }
  return fs.readFileSync(SECRET_PATH, "utf8").trim();
}

// ---------- password -------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ---------- sessioni stateless (cookie HMAC) -------------------------------

interface SessionPayload {
  pid: number;
  exp: number;
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function createSessionToken(pharmacyId: number): string {
  const payload: SessionPayload = {
    pid: pharmacyId,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const data = toBase64Url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", getSecret()).update(data).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (!payload.pid || payload.exp < Date.now()) return null;
    return payload.pid;
  } catch {
    return null;
  }
}

export async function getCurrentPharmacy(): Promise<Pharmacy | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const pharmacyId = verifySessionToken(token);
  if (!pharmacyId) return null;
  // Inizializza il DB anche quando chiamato prima dell'ensureData generale
  getDb();
  return getPharmacyById(pharmacyId);
}
