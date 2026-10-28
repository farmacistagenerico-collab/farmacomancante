#!/bin/sh
# Prepara la cartella dati persistente prima di avviare il server:
# 1. crea le sottocartelle necessarie;
# 2. copia il CSV AIFA incluso nell'immagine se il volume è vuoto
#    (il primo avvio popola il database anche senza rete);
# 3. avvisa se i segreti non sono impostati.
set -e

DATA_DIR="${FARMACOMANCANTE_DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/raw"

BUNDLED_CSV="/app/assets/elenco_medicinali_carenti.csv"
TARGET_CSV="$DATA_DIR/raw/elenco_medicinali_carenti.csv"
if [ ! -f "$TARGET_CSV" ] && [ -f "$BUNDLED_CSV" ]; then
  cp "$BUNDLED_CSV" "$TARGET_CSV"
  echo "[entrypoint] CSV AIFA iniziale copiato in $TARGET_CSV"
fi

if [ -z "$FARMACOMANCANTE_SECRET" ]; then
  echo "[entrypoint] ATTENZIONE: FARMACOMANCANTE_SECRET non impostato."
  echo "[entrypoint] Le sessioni useranno un segreto su disco in $DATA_DIR/secret.key (ok solo con volume persistente)."
fi

if [ -z "$FARMACOMANCANTE_ADMIN_EMAIL" ]; then
  echo "[entrypoint] ATTENZIONE: FARMACOMANCANTE_ADMIN_EMAIL non impostato, nessun amministratore automatico."
fi

exec "$@"
