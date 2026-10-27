import type { StockLevel } from "./types";

/** ISO yyyy-mm-dd -> dd/mm/yyyy */
export function formatDateIT(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** ISO datetime -> dd/mm/yyyy ore:min */
export function formatDateTimeIT(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return formatDateIT(iso);
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const STOCK_LEVELS: Record<
  StockLevel,
  { label: string; description: string; badgeClass: string }
> = {
  disponibile: {
    label: "Disponibile",
    description: "La farmacia ha la confezione a magazzino",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
  scarsa: {
    label: "Disponibilità scarsa",
    description: "Poche confezioni, potrebbero esaurirsi a breve",
    badgeClass: "bg-amber-100 text-amber-800 ring-amber-600/20",
  },
  ultimi_pezzi: {
    label: "Ultimi pezzi",
    description: "Ultime confezioni disponibili, consigliato contattare prima",
    badgeClass: "bg-orange-100 text-orange-800 ring-orange-600/20",
  },
};

export const STOCK_LEVEL_ORDER: StockLevel[] = [
  "disponibile",
  "scarsa",
  "ultimi_pezzi",
];

// ---------- segnalazioni di mancanza --------------------------------------

/** Validità di default di una segnalazione comunitaria (giorni) */
export const REPORT_TTL_DAYS = 14;

export const REPORTER_ROLE_LABELS: Record<string, string> = {
  farmacia: "Farmacia",
  medico: "Medico",
  cittadino: "Cittadino",
};

export const REPORT_CHANNEL_LABELS: Record<string, string> = {
  farmacia: "Mancante in farmacia",
  grossista: "Mancante dal grossista",
};

export const SHORTAGE_SIGNAL_LABELS: Record<string, string> = {
  mancante: "Mancante",
  risoluzione: "In corso di risoluzione",
};
