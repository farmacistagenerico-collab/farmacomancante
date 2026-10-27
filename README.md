# FarmacoMancante

Portale informativo sui **farmaci temporaneamente carenti in Italia**, pensato per
medici prescrittori, cittadini e farmacie.

Tre obiettivi:

1. **Lista facile da consultare** dei farmaci carenti, importata periodicamente
   dall'elenco pubblicato da AIFA, con ricerca per nome / principio attivo / codice
   AIC, equivalenti e indicazioni terapeutiche.
2. **Localizzazione delle disponibilità residue**: ogni farmacia accede a un'area
   riservata e segnala di avere temporaneamente a magazzino un farmaco carente.
   La segnalazione ha una scadenza e viene mostrata sulla scheda pubblica del
   medicinale, con recapiti e mappa, finché è valida.
3. **Segnalazioni comunitarie e semaforo**: farmacie, medici e cittadini possono
   segnalare un farmaco mancante (anche non ancora in lista AIFA) o una carenza in
   corso di risoluzione. I segnali di tutte le fonti vengono incrociati in uno
   stato a semaforo per ogni medicinale.

## Funzionalità

### Area pubblica

- Home con ricerca immediata e statistiche sempre aggiornate
- Lista dei farmaci carenti con filtri (testo libero + presenza equivalente) e paginazione
- Scheda di ogni farmaco con tutti i dati AIFA:
  principio attivo, forma e dosaggio, titolare AIC, date di inizio e fine presunta,
  motivazione della carenza, suggerimenti/indicazioni AIFA, classe di rimborsabilità, ATC
- Sezione **"Dove trovarlo"**: farmacie con disponibilità attiva, recapiti e mappa OpenStreetMap
- Ricerca a prova di accenti e maiuscole (normalizzazione Unicode)

### Semaforo delle carenze

Ogni farmaco ha uno stato calcolato incrociando tutte le fonti disponibili:

| Semaforo | Stato | Regola |
| --- | --- | --- |
| 🟢 | **Disponibilità segnalata** | almeno una farmacia ha una disponibilità attiva |
| 🟡 | **In corso di risoluzione** | nessuna disponibilità, ma esiste una segnalazione di rientro oppure la data di fine presunta AIFA è trascorsa |
| 🔴 | **Carenza temporanea** | nessun segnale positivo: il farmaco resta in lista senza disponibilità |

La lista farmaci è filtrabile per stato e sulla scheda il pannello
**"Fonti incrociate"** spiega perché un farmaco ha quel semaforo.

### Segnalazioni comunitarie

- Modulo pubblico (senza registrazione) e modulo precompilato per le farmacie autenticate
- Due tipi di segnale: **Mancante** (in farmacia o dal grossista) e **In corso di risoluzione**
- Si può segnalare anche un farmaco **non ancora presente nella lista AIFA** (nome + principio attivo liberi)
- Indicazione di ruolo (cittadino / medico / operatore di farmacia), città e nota
- Validità 14 giorni, poi la segnalazione si spegne da sola; la farmacia autrice può chiuderla anticipatamente
- Protezione anti-bot con campo esca (honeypot) e validazione server-side
- Pagina dedicata `/segnalazioni` con ricerca e storico delle segnalazioni attive

### Amministrazione e moderazione

Un'area riservata `/admin` accessibile agli amministratori (ruolo `admin`
oppure email indicata in `FARMACOMANCANTE_ADMIN_EMAIL`) permette di:

- vedere panoramica e statistiche, con le fonti e il loro ultimo aggiornamento
- **verificare le farmacie**: confronto automatico con l'anagrafe MDM importata
  (corrispondenza esatta per P.IVA/codice, o probabile per denominazione e comune)
  e approvazione manuale; le farmacie verificate mostrano un badge sulle schede pubbliche
- moderare le segnalazioni: nascondere, ripristinare, marcare come risolte o eliminare
- lanciare l'aggiornamento della lista AIFA da interfaccia

### Area farmacie

- Registrazione e accesso con email e password
- Geocodifica opzionale dell'indirizzo (Nominatim/OpenStreetMap, eseguita dal browser)
- Dashboard per:
  - cercare un farmaco carente con autocompletamento
  - segnalare disponibilità con livello di scorta, quantità indicativa, nota e data di scadenza
  - aggiornare una segnalazione (upsert) o eliminarla
  - inviare e chiudere segnalazioni di mancanza/rientro
- Le segnalazioni scadute si **disattivano automaticamente**: nessun intervento manuale necessario

## Stack tecnologico

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS v4**
- **SQLite** tramite il modulo nativo `node:sqlite` (nessun servizio esterno, zero dipendenze native)
- **Leaflet + OpenStreetMap** per le mappe
- Autenticazione senza librerie esterne: hash password con `scrypt`, sessioni con cookie HMAC firmato

## Fonti dati e incrocio

Il registro delle fonti è nella tabella `external_source` e il catalogo delle
fonti possibili in `src/lib/sources/registry.ts`:

| Fonte | Tipo | Stato implementazione |
| --- | --- | --- |
| **AIFA** — lista farmaci temporaneamente carenti ([URL CSV stabile](https://www.aifa.gov.it/documents/20142/847339/elenco_medicinali_carenti.csv)) | ufficiale | import locale e remoto con fallback automatico |
| **Ministero della Salute** — [anagrafe farmacie (open data)](https://www.dati.salute.gov.it/it/dataset/farmacie/) | ufficiale | adattatore pronto (`npm run import:farmacie-mdm`), scrive in `external_signal` |
| **Ministero della Salute** — [distributori di farmaci/grossisti](https://www.dati.salute.gov.it/it/dataset/distributori-di-farmaci-con-dettaglio-autorizzazioni/) | ufficiale | fonte registrata, adattatore pianificato |
| **Segnalazioni della comunità** | comunitaria | attiva (tabella `shortage_report`) |
| **Disponibilità delle farmacie iscritte** | interna | attiva (tabella `availability`) |

I sistemi dei grossisti privati non hanno API pubbliche: l'incrocio con i loro
magazzini richiede convenzioni/credenziali e va sviluppato come adattatore
dedicato seguendo l'interfaccia già presente. L'anagrafe MDM costituisce la base
per la validazione futura del codice ministeriale / P.IVA delle farmacie iscritte.

## Struttura

```
data/
  raw/                          CSV AIFA (committato, fa da seed al primo avvio)
  farmacomancante.db           SQLite locale (generato, gitignorato)
scripts/
  import-csv.mjs               Import/aggiornamento lista AIFA (--remote con fallback)
  import-farmacie-mdm.mjs      Adattatore anagrafe farmacie Ministero della Salute
src/
  instrumentation.ts           Avvio dello schedulatore interno
  lib/
    schema.sql                 Schema del database
    db.ts                      Connessione, query, migrazioni e auto-seed
    csv.ts / import.ts         Parsing CSV AIFA (Windows-1252, separatore ';')
    status.ts                  Motore del semaforo (regole di merge dei segnali)
    scheduler.ts               Job giornaliero di aggiornamento AIFA
    rate-limit.ts              Protezione anti-flood delle API pubbliche
    sources/                   Registro fonti e adattatore AIFA remoto
    auth.ts                    Password, sessioni, cookie, ruoli e token cron
    validation.ts / format.ts  Validazione e formattazione
  app/
    page.tsx                   Home
    farmaci/                   Lista (filtro a semaforo) e scheda farmaco
    segnalazioni/              Segnalazioni comunitarie
    admin/                     Area di amministrazione e moderazione
    area-farmacie/             Landing, registrazione, accesso, dashboard
    api/                       Route handler (auth, admin, cron, disponibilità, segnalazioni)
  components/                  UI condivisa, mappa e moduli
tests/                         Test automatici (semaforo, CSV, validazione, rate limit)
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

### Dati dimostrativi

Per provare subito semaforo, mappa e area amministrativa:

```bash
FARMACOMANCANTE_ADMIN_EMAIL=admin@farmacomancante.test npm run seed:demo
```

Lo script è idempotente e crea:

| Account | Email | Password | Note |
| --- | --- | --- | --- |
| Amministratore | `admin@farmacomancante.test` | `password123` | ruolo `admin` assegnato via `FARMACOMANCANTE_ADMIN_EMAIL` |
| Farmacia | `farmacia@farmacomancante.test` | `password123` | "Farmacia Del Porto", Sirmione (BS), già verificata |

Più una disponibilità attiva (ZYPREXA, AIC `033638204` → 🟢), una segnalazione di
risoluzione (OLANZAPINA ACCORD `041598133` → 🟡), una di mancanza (ABIOCLAV
`037350016` → 🔴) e una segnalazione libera fuori lista AIFA.
Le credenziali sono solo per uso locale: non impostare `password123` in produzione.

## Aggiornamento periodico della lista AIFA

```bash
npm run import                                  # CSV locale data/raw/elenco_medicinali_carenti.csv
npm run import:remote                           # scarica da aifa.gov.it, fallback sul CSV locale
node scripts/import-csv.mjs /percorso/del.csv   # file arbitrario
```

L'import è **idempotente** (upsert per codice AIC): mantiene intatte le segnalazioni
delle farmacie e registra ogni passaggio in `import_batch`, con la data
"aggiornato al" letta dall'intestazione del CSV. Ogni esito aggiorna anche
`external_source.last_sync_at` (stato `ok-remoto` o `fallback-locale`).

### Anagrafe ufficiale delle farmacie (validazione)

```bash
# 1. scaricare il CSV del dataset da https://www.dati.salute.gov.it/it/dataset/farmacie/
# 2. importarlo:
npm run import:farmacie-mdm -- /percorso/farmacie.csv
# oppure direttamente da URL (richiede accesso rete verso il Ministero):
node scripts/import-farmacie-mdm.mjs https://.../farmacie.csv
```

I record confluiscono in `external_signal` e sono la base per il confronto tra
il codice ministeriale/P.IVA delle farmacie iscritte e l'anagrafe ufficiale.

Per l'automazione si può schedulare `import:remote` via cron/CI (roadmap: job
schedulato interno all'applicazione).

## Aggiornamenti automatici

Due meccanismi, attivabili separatamente:

1. **Schedulatore interno** (`src/lib/scheduler.ts`, registrato da
   `src/instrumentation.ts`): al primo avvio recupera la lista se l'ultimo sync
   supera le 20 ore, poi tenta l'import remoto ogni 24 ore. Disattivabile con
   `FARMACOMANCANTE_SCHEDULER=off` (consigliato su hosting serverless).
2. **Endpoint cron** `/api/cron/importa-aifa`, protetto da
   `Authorization: Bearer <segreto>`, richiamabile da Vercel Cron
   (`vercel.json` già configurato per le 06:00), crontab o GitHub Actions.

## Variabili d'ambiente

| Variabile | Descrizione |
| --- | --- |
| `FARMACOMANCANTE_SECRET` | Segreto per firmare i cookie di sessione. Se assente, viene generato e salvato in `data/secret.key`. |
| `FARMACOMANCANTE_ADMIN_EMAIL` | Email che identifica l'amministratore (anche senza ruolo admin nel database). |
| `FARMACOMANCANTE_CRON_SECRET` | Segreto Bearer per l'endpoint cron. Se assente usa `FARMACOMANCANTE_SECRET`. |
| `FARMACOMANCANTE_SCHEDULER` | Impostare a `off` per disattivare lo schedulatore interno. |

## Test

```bash
npm test
```

Esegue con il test runner integrato di Node (via `tsx`) i test su motore del
semaforo, parser CSV, validazione e rate limiting.

## Modello dati

- `drug` — farmaci carenti (chiave: codice AIC), con colonna normalizzata per la ricerca
- `import_batch` — storico delle importazioni della lista
- `pharmacy` — anagrafica farmacie e credenziali, con `role` (farmacia/admin) e flag `verified`
- `availability` — segnalazioni `(farmacia, AIC)` con livello di scorta ed `expires_at`
- `shortage_report` — segnalazioni comunitarie di mancanza/rientro, con AIC opzionale (farmaci non in lista), ruolo del segnalatore, canale (farmacia/grossista), scadenza e flag di moderazione `hidden`
- `external_source` — registro delle fonti e timestamp dell'ultima sincronizzazione
- `external_signal` — segnali normalizzati degli adattatori esterni (es. anagrafe MDM)

## Sicurezza (stato attuale)

- Password hashate con `scrypt` e salt per-farmacia; confronto a tempo costante
- Sessioni statali in cookie `HttpOnly`, `SameSite=Lax`, con firma HMAC e scadenza
- Validazione server-side di tutti gli input e di tutte le date
- Controllo di proprietà sulle operazioni sulle segnalazioni
- Le API di scrittura sono protette: senza sessione valida rispondono `401`
- Route e API di amministrazione riservate agli admin (`403` per gli altri)
- Rate limiting in memoria sulle scritture pubbliche (segnalazioni, registrazioni, login) e campo esca anti-bot
- Endpoint di manutenzione cron protetto da token Bearer

> Stato MVP: la qualifica delle farmacie è auto-dichiarata. In produzione serve
> una verifica dell'identità (es. codice farmacia/partita IVA validato e
> moderazione) prima di rendere pubbliche le segnalazioni.

## Roadmap suggerita

- Verifica automatica delle farmacie al momento della registrazione (oggi il confronto MDM è manuale in area admin)
- Adattatore per il dataset distributori/grossisti del Ministero e, ove possibile, connettori privati
- Notifiche via email quando un farmaco passa a verde o una segnalazione di mancanza si risolve
- Pagina dedicata ai medici con vista "equivalenti + alternative AIFA"
- Export CSV/API pubblica della lista, delle disponibilità e dei segnali
- CAPTCHA sulla registrazione e rate limiting condiviso tra più istanze (es. Redis)
- PWA e segnalibro rapido dalla scheda farmaco

## Avvertenze

Le informazioni pubblicate hanno finalità informative e non sostituiscono il parere
del medico o del farmacista. Le disponibilità sono segnalate volontariamente dalle
farmacie e possono cambiare rapidamente: contattare sempre la farmacia prima di
recarsi sul posto.
