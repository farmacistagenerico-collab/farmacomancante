import type { StockLevel } from "./types";

/** ISO yyyy-mm-dd -> dd/mm/yyyy */
export function formatDateIT(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
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
