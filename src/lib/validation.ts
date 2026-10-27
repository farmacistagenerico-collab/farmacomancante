export interface FieldErrors {
  [field: string]: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value: unknown, label: string): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${label} obbligatorio`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!email) return "Email obbligatoria";
  if (!EMAIL_RE.test(email)) return "Indirizzo email non valido";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password obbligatoria";
  if (value.length < 8) return "La password deve contenere almeno 8 caratteri";
  return null;
}

export function validateCap(value: string): string | null {
  if (!value) return null;
  return /^\d{5}$/.test(value.trim()) ? null : "Il CAP deve essere di 5 cifre";
}

export function validateProvince(value: string): string | null {
  if (!value) return null;
  return /^[A-Z]{2}$/.test(value.trim().toUpperCase())
    ? null
    : "Provincia di 2 lettere (es. BS)";
}

export function validateFutureDate(value: string): string | null {
  if (!value) return "Data obbligatoria";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Data non valida";
  const today = new Date().toISOString().slice(0, 10);
  if (value < today) return "La data deve essere oggi o successiva";
  return null;
}

export function clampText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed || null;
}

const REPORTER_ROLES = ["farmacia", "medico", "cittadino"] as const;
const SHORTAGE_SIGNALS = ["mancante", "risoluzione"] as const;
const REPORT_CHANNELS = ["farmacia", "grossista"] as const;

export function validateReporterRole(value: unknown): string | null {
  return typeof value === "string" && (REPORTER_ROLES as readonly string[]).includes(value)
    ? null
    : "Ruolo non valido";
}

export function validateShortageSignal(value: unknown): string | null {
  return typeof value === "string" && (SHORTAGE_SIGNALS as readonly string[]).includes(value)
    ? null
    : "Seleziona uno stato valido";
}

export function validateReportChannel(value: unknown): string | null {
  return typeof value === "string" && (REPORT_CHANNELS as readonly string[]).includes(value)
    ? null
    : "Canale non valido";
}

export function jsonError(status: number, message: string, fields?: FieldErrors) {
  return Response.json({ ok: false, message, fields }, { status });
}
