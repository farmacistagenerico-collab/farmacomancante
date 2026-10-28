import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import { getDb, getPharmacyById } from "./db";
import type { Pharmacy } from "./types";
import { dataDir, isProduction, secretPath } from "./paths";

export const SESSION_COOKIE = "fm_session";
const SESSION_DAYS = 7;

/** True quando il segreto arriva dall'ambiente (raccomandato in produzione). */
export function hasConfiguredSecret(): boolean {
  return Boolean(process.env.FARMACOMANCANTE_SECRET?.trim());
}

let warnedAboutSecret = false;

/**
 * Segreto di firma delle sessioni. In produzione va impostato
 * FARMACOMANCANTE_SECRET: senza di esso si usa un file su disco, che è
 * accettabile solo con un volume persistente.
 */
function getSecret(): string {
  const fromEnv = process.env.FARMACOMANCANTE_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (isProduction() && !warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      "[sicurezza] FARMACOMANCANTE_SECRET non impostato: uso un segreto su file. " +
        "Impostalo nelle variabili d'ambiente per invalidare le sessioni al riavvio e per il deploy su più istanze."
    );
  }
  fs.mkdirSync(dataDir(), { recursive: true });
  const secretFile = secretPath();
  if (!fs.existsSync(secretFile)) {
    fs.writeFileSync(secretFile, randomBytes(32).toString("hex"), { mode: 0o600 });
  }
  return fs.readFileSync(secretFile, "utf8").trim();
}


/** Opzioni del cookie di sessione, con flag Secure attivo in produzione (HTTPS). */
export function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  maxAge: number;
  secure: boolean;
} {
  // Secure attivo in produzione (HTTPS). Su una preview servita in HTTP si può
  // disattivare con FARMACOMANCANTE_INSECURE_COOKIES=1, altrimenti il browser
  // scarterebbe il cookie e il login sembrerebbe non funzionare.
  const secure = isProduction() && process.env.FARMACOMANCANTE_INSECURE_COOKIES !== "1";
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure,
  };
}

/** Segreto condiviso per gli endpoint di manutenzione (es. cron). */
export function getServerSecret(): string {
  return getSecret();
}

/** Verifica l'header Authorization: Bearer dei job schedulati. */
export function verifyCronAuthorization(header: string | null): boolean {
  const expected = process.env.FARMACOMANCANTE_CRON_SECRET ?? getSecret();
  if (!header || !header.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length).trim();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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

/**
 * Amministratore: ruolo nel database oppure email indicata nella variabile
 * d'ambiente FARMACOMANCANTE_ADMIN_EMAIL (utile per il primo amministratore).
 */
export function isAdmin(pharmacy: Pharmacy | null): boolean {
  if (!pharmacy) return false;
  if (pharmacy.role === "admin") return true;
  const adminEmail = process.env.FARMACOMANCANTE_ADMIN_EMAIL?.toLowerCase().trim();
  return !!adminEmail && pharmacy.email === adminEmail;
}
