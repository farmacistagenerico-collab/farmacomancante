-- Schema del database locale (SQLite). Usato sia dall'app (src/lib/db.ts)
-- sia dallo script di importazione scripts/import-csv.mjs

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS import_batch (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file TEXT NOT NULL,
  list_date TEXT,
  imported_at TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS drug (
  aic TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active_ingredient TEXT,
  form_dosage TEXT,
  aic_holder TEXT,
  start_date TEXT,
  presumed_end_date TEXT,
  equivalent_raw TEXT,
  has_equivalent INTEGER,
  reasons TEXT,
  aifa_suggestions TEXT,
  aifa_note TEXT,
  reimbursement_class TEXT,
  atc_code TEXT,
  search_text TEXT NOT NULL,
  updated_batch_id INTEGER
);

CREATE INDEX IF NOT EXISTS idx_drug_search ON drug(search_text);

CREATE TABLE IF NOT EXISTS pharmacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  license_code TEXT,
  address TEXT,
  city TEXT NOT NULL,
  cap TEXT,
  province TEXT,
  phone TEXT,
  lat REAL,
  lng REAL,
  role TEXT NOT NULL DEFAULT 'farmacia', -- farmacia | admin
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacy(id) ON DELETE CASCADE,
  aic TEXT NOT NULL REFERENCES drug(aic) ON DELETE CASCADE,
  stock_level TEXT NOT NULL DEFAULT 'disponibile',
  quantity_label TEXT,
  note TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(pharmacy_id, aic)
);

CREATE INDEX IF NOT EXISTS idx_availability_aic ON availability(aic);
CREATE INDEX IF NOT EXISTS idx_availability_pharmacy ON availability(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_availability_expires ON availability(expires_at);

-- Registro delle fonti dati (ufficiali, comunitarie e interne) usate
-- dal motore di incrocio che calcola il semaforo delle carenze.
CREATE TABLE IF NOT EXISTS external_source (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'external', -- external | community | internal
  last_sync_at TEXT,
  last_status TEXT
);

-- Segnalazioni comunitarie di mancanza (farmacie, medici, cittadini).
-- Coprono sia farmaci già nella lista AIFA (aic valorizzato) sia
-- farmaci non ancora ufficialmente in carenza (aic NULL, testo libero).
CREATE TABLE IF NOT EXISTS shortage_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pharmacy_id INTEGER REFERENCES pharmacy(id) ON DELETE SET NULL,
  reporter_role TEXT NOT NULL,           -- farmacia | medico | cittadino
  reporter_name TEXT,
  aic TEXT REFERENCES drug(aic) ON DELETE SET NULL,
  drug_name TEXT NOT NULL,
  active_ingredient TEXT,
  city TEXT,
  province TEXT,
  channel TEXT NOT NULL DEFAULT 'farmacia', -- farmacia | grossista
  signal TEXT NOT NULL,                   -- mancante | risoluzione
  note TEXT,
  status TEXT NOT NULL DEFAULT 'attivo',  -- attivo | risolto
  reviewed INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shortage_aic ON shortage_report(aic);
CREATE INDEX IF NOT EXISTS idx_shortage_active ON shortage_report(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_shortage_pharmacy ON shortage_report(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_shortage_name ON shortage_report(drug_name);

-- Segnali normalizzati provenienti da adattatori di fonti esterne
-- (es. anagrafe farmacie MDM, liste AIFA equivalenti/alternative).
CREATE TABLE IF NOT EXISTS external_signal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_code TEXT NOT NULL REFERENCES external_source(code) ON DELETE CASCADE,
  aic TEXT,
  subject TEXT,
  signal TEXT NOT NULL,
  payload_json TEXT,
  fetched_at TEXT NOT NULL,
  UNIQUE(source_code, aic, subject)
);

CREATE INDEX IF NOT EXISTS idx_external_signal_aic ON external_signal(aic);
