# FarmacoMancante

Portale informativo sui **farmaci temporaneamente carenti in Italia**, pensato per
medici prescrittori, cittadini e farmacie.

Due obiettivi:

1. **Lista facile da consultare** dei farmaci carenti, importata periodicamente
   dall'elenco pubblicato da AIFA, con ricerca per nome / principio attivo / codice
   AIC, equivalenti e indicazioni terapeutiche.
2. **Localizzazione delle disponibilità residue**: ogni farmacia accede a un'area
   riservata e segnala di avere temporaneamente a magazzino un farmaco carente.
   La segnalazione ha una scadenza e viene mostrata sulla scheda pubblica del
   medicinale, con recapiti e mappa, finché è valida.

## Funzionalità

### Area pubblica

- Home con ricerca immediata e statistiche sempre aggiornate
- Lista dei farmaci carenti con filtri (testo libero + presenza equivalente) e paginazione
- Scheda di ogni farmaco con tutti i dati AIFA:
  principio attivo, forma e dosaggio, titolare AIC, date di inizio e fine presunta,
  motivazione della carenza, suggerimenti/indicazioni AIFA, classe di rimborsabilità, ATC
- Sezione **"Dove trovarlo"**: farmacie con disponibilità attiva, recapiti e mappa OpenStreetMap
- Ricerca a prova di accenti e maiuscole (normalizzazione Unicode)

### Area farmacie

- Registrazione e accesso con email e password
- Geocodifica opzionale dell'indirizzo (Nominatim/OpenStreetMap, eseguita dal browser)
- Dashboard per:
  - cercare un farmaco carente con autocompletamento
  - segnalare disponibilità con livello di scorta, quantità indicativa, nota e data di scadenza
  - aggiornare una segnalazione (upsert) o eliminarla
- Le segnalazioni scadute si **disattivano automaticamente**: nessun intervento manuale necessario

## Stack tecnologico

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS v4**
- **SQLite** tramite il modulo nativo `node:sqlite` (nessun servizio esterno, zero dipendenze native)
- **Leaflet + OpenStreetMap** per le mappe
- Autenticazione senza librerie esterne: hash password con `scrypt`, sessioni con cookie HMAC firmato

## Struttura

```
data/
  raw/                          CSV AIFA (committato, fa da seed al primo avvio)
  farmacomancante.db           SQLite locale (generato, gitignorato)
scripts/
  import-csv.mjs               Import/aggiornamento lista da CSV
src/
  lib/
    schema.sql                 Schema del database
    db.ts                      Connessione, query e auto-seed
    csv.ts / import.ts         Parsing CSV AIFA (Windows-1252, separatore ';')
    auth.ts                    Password, sessioni, cookie
    validation.ts / format.ts  Validazione e formattazione
  app/
    page.tsx                   Home
    farmaci/                   Lista e scheda farmaco
    area-farmacie/             Landing, registrazione, accesso, dashboard
    api/                       Route handler (auth, disponibilità, ricerca)
  components/                  UI condivisa e mappa
```

## Avvio rapido

```bash
npm install
npm run dev
# aprire http://localhost:3000
```

Al primo avvio il database viene creato e popolato automaticamente importando
`data/raw/elenco_medicinali_carenti.csv` (la lista AIFA allegata al progetto).

Produzione:

```bash
npm run build
npm run start
```

## Aggiornamento periodico della lista AIFA

1. Scaricare la nuova versione dell'elenco farmaci carenti dal sito AIFA (CSV).
2. Sovrascrivere/passare il file e rilanciare l'import:

```bash
npm run import                                  # usa data/raw/elenco_medicinali_carenti.csv
node scripts/import-csv.mjs /percorso/del.csv   # oppure un file arbitrario
```

L'import è **idempotente** (upsert per codice AIC): mantiene intatte le segnalazioni
delle farmacie e registra ogni passaggio in `import_batch`, con la data
"aggiornato al" letta dall'intestazione del CSV.

Per l'automazione si può schedulare il comando via cron/CI e poi riavviare
l'applicazione (roadmap: job schedulato interno).

## Variabili d'ambiente

| Variabile | Descrizione |
| --- | --- |
| `FARMACOMANCANTE_SECRET` | Segreto per firmare i cookie di sessione. Se assente, viene generato e salvato in `data/secret.key`. |

## Modello dati

- `drug` — farmaci carenti (chiave: codice AIC), con colonna normalizzata per la ricerca
- `import_batch` — storico delle importazioni della lista
- `pharmacy` — anagrafica farmacie e credenziali
- `availability` — segnalazioni `(farmacia, AIC)` con livello di scorta ed `expires_at`

## Sicurezza (stato attuale)

- Password hashate con `scrypt` e salt per-farmacia; confronto a tempo costante
- Sessioni statali in cookie `HttpOnly`, `SameSite=Lax`, con firma HMAC e scadenza
- Validazione server-side di tutti gli input e di tutte le date
- Controllo di proprietà sulle operazioni sulle segnalazioni
- Le API di scrittura sono protette: senza sessione valida rispondono `401`

> Stato MVP: la qualifica delle farmacie è auto-dichiarata. In produzione serve
> una verifica dell'identità (es. codice farmacia/partita IVA validato e
> moderazione) prima di rendere pubbliche le segnalazioni.

## Roadmap suggerita

- Verifica/moderazione delle farmacie e pagina di amministrazione
- Schedulazione automatica dell'import AIFA (job periodico)
- Notifiche via email quando un farmaco torna disponibile
- Pagina dedicata ai medici con vista "equivalenti + alternative AIFA"
- Export CSV/API pubblica della lista e delle disponibilità
- Test automatici e misure anti-abuso (rate limiting, CAPTCHA sulla registrazione)
- PWA e segnalibro rapido dalla scheda farmaco

## Avvertenze

Le informazioni pubblicate hanno finalità informative e non sostituiscono il parere
del medico o del farmacista. Le disponibilità sono segnalate volontariamente dalle
farmacie e possono cambiare rapidamente: contattare sempre la farmacia prima di
recarsi sul posto.
