import type { DrugStatus, DrugStatusInfo } from "./types";
import { todayISO } from "./format";

/**
 * Motore di incrocio ("semaforo") che combina i segnali delle diverse fonti:
 *
 *  🟢 disponibile  — almeno una farmacia segnala disponibilità attiva
 *  🟡 risoluzione  — nessuna disponibilità, ma esistono segnali di
 *                    risoluzione (riordino in arrivo) oppure la data di
 *                    fine presunta AIFA è già trascinata
 *  🔴 carenza      — tutto il resto: farmaco in lista AIFA senza segnali positivi
 *
 * L'ordine dei controlli è deliberato: la disponibilità concreta in una
 * farmacia ha sempre la precedenza su qualunque altro segnale.
 */
export function computeDrugStatus(input: {
  availabilityCount: number;
  mancanteCount: number;
  risoluzioneCount: number;
  presumedEndDate: string | null;
}): DrugStatus {
  if (input.availabilityCount > 0) return "disponibile";

  const today = todayISO();
  if (input.risoluzioneCount > 0) return "risoluzione";
  if (input.presumedEndDate && input.presumedEndDate <= today) return "risoluzione";

  return "carenza";
}

export const STATUS_META: Record<
  DrugStatus,
  { label: string; description: string; dotClass: string; badgeClass: string }
> = {
  carenza: {
    label: "Carenza temporanea",
    description: "Nessuna farmacia segnala disponibilità e non risultano segnali di rientro",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-800 ring-red-600/20",
  },
  risoluzione: {
    label: "In corso di risoluzione",
    description: "Segnali di rientro o fine presunta della carenza superata",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 ring-amber-600/20",
  },
  disponibile: {
    label: "Disponibilità segnalata",
    description: "Almeno una farmacia ha confermato la disponibilità a magazzino",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
};

export function emptyStatusInfo(): DrugStatusInfo {
  return {
    status: "carenza",
    availabilityCount: 0,
    mancanteCount: 0,
    risoluzioneCount: 0,
    reasons: [],
  };
}
