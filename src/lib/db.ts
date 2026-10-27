import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type {
  Availability,
  AvailabilityView,
  Drug,
  DrugListItem,
  DrugStatus,
  DrugStatusInfo,
  ExternalSource,
  Pharmacy,
  ShortageReport,
  ShortageReportView,
  StockLevel,
} from "./types";
import { normalizeSearch } from "./csv";
import { todayISO } from "./format";
import { computeDrugStatus } from "./status";
import { SOURCE_REGISTRY } from "./sources/registry";

const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "farmacomancante.db");
export const RAW_CSV_PATH = path.join(DATA_DIR, "raw", "elenco_medicinali_carenti.csv");

type GlobalWithDb = typeof globalThis & { __farmacomancanteDb?: DatabaseSync };

function createSchema(db: DatabaseSync): void {
  const schemaPath = path.join(process.cwd(), "src", "lib", "schema.sql");
  db.exec(fs.readFileSync(schemaPath, "utf8"));
}

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalWithDb;
  if (!g.__farmacomancanteDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    createSchema(db);
    seedSources(db);
    g.__farmacomancanteDb = db;
  }
  return g.__farmacomancanteDb;
}

/** Popola il registro delle fonti al primo avvio, senza sovrascrivere lo stato di sync. */
function seedSources(db: DatabaseSync): void {
  const stmt = db.prepare(
    `INSERT INTO external_source (code, name, description, kind)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       kind = excluded.kind`
  );
  for (const s of SOURCE_REGISTRY) {
    stmt.run(s.code, s.name, s.description, s.kind);
  }
}

export function markSourceSynced(code: string, status = "ok"): void {
  run(
    "UPDATE external_source SET last_sync_at = ?, last_status = ? WHERE code = ?",
    new Date().toISOString(),
    status,
    code
  );
}

export function listSources(): ExternalSource[] {
  return all<{
    code: string;
    name: string;
    description: string | null;
    kind: string;
    last_sync_at: string | null;
    last_status: string | null;
  }>("SELECT * FROM external_source ORDER BY kind, name").map((r) => ({
    code: r.code,
    name: r.name,
    description: r.description,
    kind: r.kind,
    lastSyncAt: r.last_sync_at,
    lastStatus: r.last_status,
  }));
}

// Helper tipati: i tipi di node:sqlite restituiscono Record generici,
// qui centralizziamo il cast verso i nostri tipi di dominio.
function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return getDb().prepare(sql).all(...params) as unknown as T[];
}
function one<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return getDb().prepare(sql).get(...params) as unknown as T | undefined;
}
function run(sql: string, ...params: SQLInputValue[]) {
  return getDb().prepare(sql).run(...params);
}

/** Al primo avvio importa automaticamente il CSV presente in data/raw */
export async function ensureData(): Promise<void> {
  const count = one<{ n: number }>("SELECT COUNT(*) AS n FROM drug");
  if ((count?.n ?? 0) === 0 && fs.existsSync(RAW_CSV_PATH)) {
    const { importCsv } = await import("./import");
    await importCsv(getDb(), RAW_CSV_PATH);
  }
}

// ---------- mapping righe -> tipi -----------------------------------------

interface DrugRow {
  aic: string;
  name: string;
  active_ingredient: string | null;
  form_dosage: string | null;
  aic_holder: string | null;
  start_date: string | null;
  presumed_end_date: string | null;
  equivalent_raw: string | null;
  has_equivalent: number | null;
  reasons: string | null;
  aifa_suggestions: string | null;
  aifa_note: string | null;
  reimbursement_class: string | null;
  atc_code: string | null;
}

function mapDrug(row: DrugRow): Drug {
  return {
    aic: row.aic,
    name: row.name,
    activeIngredient: row.active_ingredient,
    formDosage: row.form_dosage,
    aicHolder: row.aic_holder,
    startDate: row.start_date,
    presumedEndDate: row.presumed_end_date,
    equivalentRaw: row.equivalent_raw,
    hasEquivalent: row.has_equivalent,
    reasons: row.reasons,
    aifaSuggestions: row.aifa_suggestions,
    aifaNote: row.aifa_note,
    reimbursementClass: row.reimbursement_class,
    atcCode: row.atc_code,
  };
}

// ---------- query farmaci --------------------------------------------------

export interface SearchParams {
  q?: string;
  equivalent?: "si" | "no";
  status?: DrugStatus;
  page?: number;
  pageSize?: number;
}

const AVAIL_EXISTS =
  "EXISTS (SELECT 1 FROM availability av WHERE av.aic = d.aic AND av.expires_at >= ?)";
const RISOLUZIONE_EXISTS =
  "EXISTS (SELECT 1 FROM shortage_report sr WHERE sr.aic = d.aic AND sr.status = 'attivo' AND sr.expires_at >= ? AND sr.signal = 'risoluzione')";

export function searchDrugs(params: SearchParams): {
  items: (DrugListItem & {
    mancanteCount: number;
    risoluzioneCount: number;
    status: DrugStatus;
  })[];
  total: number;
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const today = todayISO();

  const where: string[] = [];
  const bindings: SQLInputValue[] = [];

  const term = normalizeSearch(params.q ?? "");
  if (term) {
    for (const token of term.split(" ").filter(Boolean)) {
      where.push("search_text LIKE ?");
      bindings.push(`%${token}%`);
    }
  }
  if (params.equivalent === "si") where.push("has_equivalent = 1");
  if (params.equivalent === "no") where.push("has_equivalent = 0");

  // Filtro a semaforo: le tre condizioni sono mutuamente esclusive
  if (params.status === "disponibile") {
    where.push(AVAIL_EXISTS);
    bindings.push(today);
  } else if (params.status === "risoluzione") {
    where.push(`NOT ${AVAIL_EXISTS}`);
    bindings.push(today);
    where.push(`(${RISOLUZIONE_EXISTS} OR (d.presumed_end_date IS NOT NULL AND d.presumed_end_date <= ?))`);
    bindings.push(today, today);
  } else if (params.status === "carenza") {
    where.push(`NOT ${AVAIL_EXISTS}`);
    bindings.push(today);
    where.push(`NOT ${RISOLUZIONE_EXISTS}`);
    bindings.push(today);
    where.push("(d.presumed_end_date IS NULL OR d.presumed_end_date > ?)");
    bindings.push(today);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const total = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM drug d ${whereSql}`,
    ...bindings
  )!.n;

  const rows = all<
    DrugRow & { active_count: number; mancante_count: number; risoluzione_count: number }
  >(
    `SELECT d.*,
      (SELECT COUNT(*) FROM availability av
         WHERE av.aic = d.aic AND av.expires_at >= ?) AS active_count,
      (SELECT COUNT(*) FROM shortage_report sr
         WHERE sr.aic = d.aic AND sr.status = 'attivo' AND sr.expires_at >= ? AND sr.signal = 'mancante') AS mancante_count,
      (SELECT COUNT(*) FROM shortage_report sr
         WHERE sr.aic = d.aic AND sr.status = 'attivo' AND sr.expires_at >= ? AND sr.signal = 'risoluzione') AS risoluzione_count
     FROM drug d
     ${whereSql}
     ORDER BY d.name COLLATE NOCASE ASC
     LIMIT ? OFFSET ?`,
    today,
    today,
    today,
    ...bindings,
    pageSize,
    (page - 1) * pageSize
  );

  return {
    items: rows.map((r) => {
      const base = { ...mapDrug(r), activeCount: r.active_count };
      const status = computeDrugStatus({
        availabilityCount: r.active_count,
        mancanteCount: r.mancante_count,
        risoluzioneCount: r.risoluzione_count,
        presumedEndDate: r.presumed_end_date,
      });
      return {
        ...base,
        mancanteCount: r.mancante_count,
        risoluzioneCount: r.risoluzione_count,
        status,
      };
    }),
    total,
    page,
    pageSize,
  };
}

/** Semaforo e contatori dei segnali per un singolo farmaco */
export function getDrugStatusInfo(aic: string, presumedEndDate: string | null): DrugStatusInfo {
  const today = todayISO();
  const row = one<{
    availability_count: number;
    mancante_count: number;
    risoluzione_count: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM availability av WHERE av.aic = ? AND av.expires_at >= ?) AS availability_count,
      (SELECT COUNT(*) FROM shortage_report sr WHERE sr.aic = ? AND sr.status = 'attivo' AND sr.expires_at >= ? AND sr.signal = 'mancante') AS mancante_count,
      (SELECT COUNT(*) FROM shortage_report sr WHERE sr.aic = ? AND sr.status = 'attivo' AND sr.expires_at >= ? AND sr.signal = 'risoluzione') AS risoluzione_count`,
    aic,
    today,
    aic,
    today,
    aic,
    today
  )!;

  const status = computeDrugStatus({
    availabilityCount: row.availability_count,
    mancanteCount: row.mancante_count,
    risoluzioneCount: row.risoluzione_count,
    presumedEndDate,
  });

  const reasons: string[] = [];
  if (row.availability_count > 0)
    reasons.push(`${row.availability_count} disponibilità attiva/e dalle farmacie`);
  if (row.risoluzione_count > 0)
    reasons.push(`${row.risoluzione_count} segnalazione/i di risoluzione in corso`);
  if (row.mancante_count > 0)
    reasons.push(`${row.mancante_count} segnalazione/i di mancanza`);
  if (presumedEndDate && presumedEndDate <= today)
    reasons.push("data di fine presunta AIFA già trascorsa");

  return {
    status,
    availabilityCount: row.availability_count,
    mancanteCount: row.mancante_count,
    risoluzioneCount: row.risoluzione_count,
    reasons,
  };
}

export function getDrugByAic(aic: string): Drug | null {
  const row = one<DrugRow>("SELECT * FROM drug WHERE aic = ?", aic);
  return row ? mapDrug(row) : null;
}

// ---------- lista AIFA / statistiche --------------------------------------

export function getLatestBatch(): {
  listDate: string | null;
  importedAt: string;
  rowCount: number;
} | null {
  const row = one<{ list_date: string | null; imported_at: string; row_count: number }>(
    "SELECT list_date, imported_at, row_count FROM import_batch ORDER BY id DESC LIMIT 1"
  );
  if (!row) return null;
  return {
    listDate: row.list_date,
    importedAt: row.imported_at,
    rowCount: row.row_count,
  };
}

export function getStats(): {
  drugCount: number;
  activeAvailabilityCount: number;
  pharmacyCount: number;
  activeReportCount: number;
} {
  const today = todayISO();
  return {
    drugCount: one<{ n: number }>("SELECT COUNT(*) AS n FROM drug")!.n,
    pharmacyCount: one<{ n: number }>("SELECT COUNT(*) AS n FROM pharmacy")!.n,
    activeAvailabilityCount: one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM availability WHERE expires_at >= ?",
      today
    )!.n,
    activeReportCount: one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM shortage_report WHERE status = 'attivo' AND expires_at >= ?",
      today
    )!.n,
  };
}

// ---------- farmacie -------------------------------------------------------

interface PharmacyRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  license_code: string | null;
  address: string | null;
  city: string;
  cap: string | null;
  province: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

function mapPharmacy(row: PharmacyRow): Pharmacy {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    licenseCode: row.license_code,
    address: row.address,
    city: row.city,
    cap: row.cap,
    province: row.province,
    phone: row.phone,
    lat: row.lat,
    lng: row.lng,
    createdAt: row.created_at,
  };
}

export interface NewPharmacyInput {
  email: string;
  passwordHash: string;
  name: string;
  licenseCode?: string | null;
  address?: string | null;
  city: string;
  cap?: string | null;
  province?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function createPharmacy(input: NewPharmacyInput): Pharmacy {
  const createdAt = new Date().toISOString();
  const result = run(
    `INSERT INTO pharmacy
      (email, password_hash, name, license_code, address, city, cap, province, phone, lat, lng, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.email.toLowerCase().trim(),
    input.passwordHash,
    input.name.trim(),
    input.licenseCode ?? null,
    input.address ?? null,
    input.city.trim(),
    input.cap ?? null,
    input.province ?? null,
    input.phone ?? null,
    input.lat ?? null,
    input.lng ?? null,
    createdAt
  );
  return getPharmacyById(Number(result.lastInsertRowid))!;
}

export function getPharmacyByEmail(email: string): Pharmacy | null {
  const row = one<PharmacyRow>(
    "SELECT * FROM pharmacy WHERE email = ?",
    email.toLowerCase().trim()
  );
  return row ? mapPharmacy(row) : null;
}

export function getPharmacyById(id: number): Pharmacy | null {
  const row = one<PharmacyRow>("SELECT * FROM pharmacy WHERE id = ?", id);
  return row ? mapPharmacy(row) : null;
}

export function getPharmacyPasswordHash(
  email: string
): { id: number; passwordHash: string } | null {
  const row = one<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM pharmacy WHERE email = ?",
    email.toLowerCase().trim()
  );
  return row ? { id: row.id, passwordHash: row.password_hash } : null;
}

// ---------- disponibilità --------------------------------------------------

interface AvailabilityRow {
  id: number;
  pharmacy_id: number;
  aic: string;
  stock_level: string;
  quantity_label: string | null;
  note: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface AvailabilityJoinRow extends AvailabilityRow {
  drug_name: string;
  pharmacy_name: string;
  pharmacy_address: string | null;
  pharmacy_city: string;
  pharmacy_province: string | null;
  pharmacy_cap: string | null;
  pharmacy_phone: string | null;
  pharmacy_lat: number | null;
  pharmacy_lng: number | null;
}

function mapAvailability(row: AvailabilityRow): Availability {
  return {
    id: row.id,
    pharmacyId: row.pharmacy_id,
    aic: row.aic,
    stockLevel: row.stock_level as StockLevel,
    quantityLabel: row.quantity_label,
    note: row.note,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAvailabilityView(row: AvailabilityJoinRow): AvailabilityView {
  return {
    ...mapAvailability(row),
    drugName: row.drug_name,
    pharmacy: {
      id: row.pharmacy_id,
      name: row.pharmacy_name,
      address: row.pharmacy_address,
      city: row.pharmacy_city,
      province: row.pharmacy_province,
      cap: row.pharmacy_cap,
      phone: row.pharmacy_phone,
      lat: row.pharmacy_lat,
      lng: row.pharmacy_lng,
    },
  };
}

const AVAILABILITY_SELECT = `
  SELECT a.*, d.name AS drug_name,
         p.name AS pharmacy_name, p.address AS pharmacy_address,
         p.city AS pharmacy_city, p.province AS pharmacy_province,
         p.cap AS pharmacy_cap, p.phone AS pharmacy_phone,
         p.lat AS pharmacy_lat, p.lng AS pharmacy_lng
  FROM availability a
  JOIN drug d ON d.aic = a.aic
  JOIN pharmacy p ON p.id = a.pharmacy_id`;

export interface UpsertAvailabilityInput {
  pharmacyId: number;
  aic: string;
  stockLevel: StockLevel;
  quantityLabel?: string | null;
  note?: string | null;
  expiresAt: string;
}

export function upsertAvailability(input: UpsertAvailabilityInput): Availability {
  const now = new Date().toISOString();
  run(
    `INSERT INTO availability
       (pharmacy_id, aic, stock_level, quantity_label, note, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(pharmacy_id, aic) DO UPDATE SET
       stock_level = excluded.stock_level,
       quantity_label = excluded.quantity_label,
       note = excluded.note,
       expires_at = excluded.expires_at,
       updated_at = excluded.updated_at`,
    input.pharmacyId,
    input.aic,
    input.stockLevel,
    input.quantityLabel ?? null,
    input.note ?? null,
    input.expiresAt,
    now,
    now
  );
  const row = one<AvailabilityRow>(
    "SELECT * FROM availability WHERE pharmacy_id = ? AND aic = ?",
    input.pharmacyId,
    input.aic
  )!;
  return mapAvailability(row);
}

export function deleteAvailability(id: number, pharmacyId: number): boolean {
  const result = run(
    "DELETE FROM availability WHERE id = ? AND pharmacy_id = ?",
    id,
    pharmacyId
  );
  return result.changes > 0;
}

export function listMyAvailability(pharmacyId: number): AvailabilityView[] {
  return all<AvailabilityJoinRow>(
    `${AVAILABILITY_SELECT}
     WHERE a.pharmacy_id = ?
     ORDER BY a.expires_at DESC, d.name COLLATE NOCASE ASC`,
    pharmacyId
  ).map(mapAvailabilityView);
}

export function getActiveAvailability(aic: string): AvailabilityView[] {
  const today = todayISO();
  return all<AvailabilityJoinRow>(
    `${AVAILABILITY_SELECT}
     WHERE a.aic = ? AND a.expires_at >= ?
     ORDER BY
       CASE a.stock_level WHEN 'disponibile' THEN 0 WHEN 'scarsa' THEN 1 ELSE 2 END,
       p.city COLLATE NOCASE ASC`,
    aic,
    today
  ).map(mapAvailabilityView);
}

export function recordImportBatch(
  sourceFile: string,
  listDate: string | null,
  rowCount: number
): void {
  run(
    "INSERT INTO import_batch (source_file, list_date, imported_at, row_count) VALUES (?, ?, ?, ?)",
    sourceFile,
    listDate,
    new Date().toISOString(),
    rowCount
  );
}

// ---------- segnalazioni comunitarie di mancanza --------------------------

interface ShortageReportRow {
  id: number;
  pharmacy_id: number | null;
  reporter_role: string;
  reporter_name: string | null;
  aic: string | null;
  drug_name: string;
  active_ingredient: string | null;
  city: string | null;
  province: string | null;
  channel: string;
  signal: string;
  note: string | null;
  status: string;
  reviewed: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  pharmacy_name: string | null;
}

function mapShortageReport(row: ShortageReportRow): ShortageReportView {
  return {
    id: row.id,
    pharmacyId: row.pharmacy_id,
    reporterRole: row.reporter_role as ShortageReport["reporterRole"],
    reporterName: row.reporter_name,
    aic: row.aic,
    drugName: row.drug_name,
    activeIngredient: row.active_ingredient,
    city: row.city,
    province: row.province,
    channel: row.channel as ShortageReport["channel"],
    signal: row.signal as ShortageReport["signal"],
    note: row.note,
    status: row.status as ShortageReport["status"],
    reviewed: row.reviewed,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pharmacyName: row.pharmacy_name,
  };
}

export interface NewShortageReportInput {
  pharmacyId?: number | null;
  reporterRole: ShortageReport["reporterRole"];
  reporterName?: string | null;
  aic?: string | null;
  drugName: string;
  activeIngredient?: string | null;
  city?: string | null;
  province?: string | null;
  channel: ShortageReport["channel"];
  signal: ShortageReport["signal"];
  note?: string | null;
  expiresAt: string;
}

export function createShortageReport(input: NewShortageReportInput): ShortageReport {
  const now = new Date().toISOString();
  const result = run(
    `INSERT INTO shortage_report
       (pharmacy_id, reporter_role, reporter_name, aic, drug_name, active_ingredient,
        city, province, channel, signal, note, status, reviewed, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'attivo', 0, ?, ?, ?)`,
    input.pharmacyId ?? null,
    input.reporterRole,
    input.reporterName ?? null,
    input.aic ?? null,
    input.drugName,
    input.activeIngredient ?? null,
    input.city ?? null,
    input.province ?? null,
    input.channel,
    input.signal,
    input.note ?? null,
    input.expiresAt,
    now,
    now
  );
  const row = one<ShortageReportRow>(
    `SELECT sr.*, p.name AS pharmacy_name
     FROM shortage_report sr LEFT JOIN pharmacy p ON p.id = sr.pharmacy_id
     WHERE sr.id = ?`,
    Number(result.lastInsertRowid)
  )!;
  return mapShortageReport(row);
}

const REPORT_SELECT = `
  SELECT sr.*, p.name AS pharmacy_name
  FROM shortage_report sr
  LEFT JOIN pharmacy p ON p.id = sr.pharmacy_id`;

export function listActiveReportsByAic(aic: string): ShortageReportView[] {
  const today = todayISO();
  return all<ShortageReportRow>(
    `${REPORT_SELECT}
     WHERE sr.aic = ? AND sr.status = 'attivo' AND sr.expires_at >= ?
     ORDER BY sr.created_at DESC`,
    aic,
    today
  ).map(mapShortageReport);
}

export function listReportsByPharmacy(pharmacyId: number): ShortageReportView[] {
  return all<ShortageReportRow>(
    `${REPORT_SELECT} WHERE sr.pharmacy_id = ? ORDER BY sr.created_at DESC`,
    pharmacyId
  ).map(mapShortageReport);
}

export function resolveShortageReport(id: number, pharmacyId: number): boolean {
  const result = run(
    "UPDATE shortage_report SET status = 'risolto', updated_at = ? WHERE id = ? AND pharmacy_id = ?",
    new Date().toISOString(),
    id,
    pharmacyId
  );
  return result.changes > 0;
}

export function listCommunityReports(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): { items: ShortageReportView[]; total: number; page: number; pageSize: number } {
  const today = todayISO();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where = ["sr.status = 'attivo'", "sr.expires_at >= ?"];
  const bindings: SQLInputValue[] = [today];

  const term = normalizeSearch(params.q ?? "");
  if (term) {
    for (const token of term.split(" ").filter(Boolean)) {
      where.push("(UPPER(sr.drug_name) LIKE ? OR UPPER(COALESCE(sr.active_ingredient, '')) LIKE ? OR sr.aic LIKE ?)");
      bindings.push(`%${token}%`, `%${token}%`, `%${token}%`);
    }
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;
  const total = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM shortage_report sr ${whereSql}`,
    ...bindings
  )!.n;
  const rows = all<ShortageReportRow>(
    `${REPORT_SELECT} ${whereSql}
     ORDER BY sr.created_at DESC
     LIMIT ? OFFSET ?`,
    ...bindings,
    pageSize,
    (page - 1) * pageSize
  );
  return { items: rows.map(mapShortageReport), total, page, pageSize };
}

/** Segnalazioni attive corrispondenti a un termine, anche per farmaci non in lista AIFA */
export function searchCommunityReports(q: string, limit = 5): ShortageReportView[] {
  const today = todayISO();
  const term = normalizeSearch(q);
  if (!term) return [];
  const tokens = term.split(" ").filter(Boolean);
  const where = ["sr.status = 'attivo'", "sr.expires_at >= ?"];
  const bindings: SQLInputValue[] = [today];
  for (const token of tokens) {
    where.push("(UPPER(sr.drug_name) LIKE ? OR UPPER(COALESCE(sr.active_ingredient, '')) LIKE ?)");
    bindings.push(`%${token}%`, `%${token}%`);
  }
  return all<ShortageReportRow>(
    `${REPORT_SELECT} WHERE ${where.join(" AND ")}
     ORDER BY sr.created_at DESC LIMIT ?`,
    ...bindings,
    limit
  ).map(mapShortageReport);
}
