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
