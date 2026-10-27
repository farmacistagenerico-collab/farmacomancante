// Tipi dominio condivisi

export interface Drug {
  aic: string;
  name: string;
  activeIngredient: string | null;
  formDosage: string | null;
  aicHolder: string | null;
  startDate: string | null;
  presumedEndDate: string | null;
  /** Valore grece della colonna "Equivalente" del CSV AIFA */
  equivalentRaw: string | null;
  /** 1 = equivalente disponibile, 0 = nessun equivalente, null = non dichiarato */
  hasEquivalent: number | null;
  reasons: string | null;
  aifaSuggestions: string | null;
  aifaNote: string | null;
  reimbursementClass: string | null;
  atcCode: string | null;
}

export interface DrugListItem extends Drug {
  /** Numero di farmacie che al momento segnalano disponibilità per questo AIC */
  activeCount: number;
}

export interface Pharmacy {
  id: number;
  email: string;
  name: string;
  licenseCode: string | null;
  address: string | null;
  city: string;
  cap: string | null;
  province: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  role: "farmacia" | "admin";
  verified: number;
  createdAt: string;
}

export type StockLevel = "disponibile" | "scarsa" | "ultimi_pezzi";

export interface Availability {
  id: number;
  pharmacyId: number;
  aic: string;
  stockLevel: StockLevel;
  quantityLabel: string | null;
  note: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityView extends Availability {
  pharmacy: Pick<
    Pharmacy,
    | "id"
    | "name"
    | "address"
    | "city"
    | "province"
    | "cap"
    | "phone"
    | "lat"
    | "lng"
    | "verified"
  >;
  drugName: string;
}

export interface ImportSummary {
  sourceFile: string;
  listDate: string | null;
  importedAt: string;
  totalRows: number;
  inserted: number;
  updated: number;
}

// ---------- semaforo carenze ----------------------------------------------

export type DrugStatus = "carenza" | "risoluzione" | "disponibile";

export type ReporterRole = "farmacia" | "medico" | "cittadino";
export type ReportChannel = "farmacia" | "grossista";
export type ShortageSignal = "mancante" | "risoluzione";
export type ShortageReportStatus = "attivo" | "risolto";

export interface ShortageReport {
  id: number;
  pharmacyId: number | null;
  reporterRole: ReporterRole;
  reporterName: string | null;
  aic: string | null;
  drugName: string;
  activeIngredient: string | null;
  city: string | null;
  province: string | null;
  channel: ReportChannel;
  signal: ShortageSignal;
  note: string | null;
  status: ShortageReportStatus;
  reviewed: number;
  hidden: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortageReportView extends ShortageReport {
  pharmacyName: string | null;
}

export interface DrugStatusInfo {
  status: DrugStatus;
  availabilityCount: number;
  mancanteCount: number;
  risoluzioneCount: number;
  reasons: string[];
}

export interface ExternalSource {
  code: string;
  name: string;
  description: string | null;
  kind: string;
  lastSyncAt: string | null;
  lastStatus: string | null;
}
