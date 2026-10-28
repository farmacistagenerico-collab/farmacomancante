# FarmacoMancante — cosa sa fare

Scheda di presentazione per chi prova il portale. Stato al 28 ottobre 2026, versione 1.0.0.

---

## In una frase

Un portale pubblico che risponde a una domanda concreta: **«questo farmaco carente
si trova, oppure no?»** — incrociando la lista ufficiale AIFA con le disponibilità
dichiarate dalle farmacie e con le segnalazioni di medici e cittadini.

---

## 1. Per medici e cittadini (parte pubblica)

| Funzione | Dove | Cosa fa |
| --- | --- | --- |
| **Ricerca farmaco** | home e `/farmaci` | Per nome, principio attivo, codice AIC o codice ATC. Normalizza accenti e maiuscole. |
| **Lista carenti** | `/farmaci` | Tutti i 2514 medicinali dell'elenco AIFA, con filtri: equivalenti sì/no, stato del semaforo, paginazione. |
| **Semaforo delle carenze** | ovunque | 🟢 disponibile in farmacia · 🟡 carenza in risoluzione · 🔴 carente. Un solo stato per AIC, calcolato incrociando tutte le fonti. |
| **Scheda farmaco** | `/farmaci/{AIC}` | Indicazioni AIFA, equivalenti, motivo della carenza, date di inizio e fine presunta, stato, disponibilità attive con indirizzo e telefono, mappa. |
| **Mappa delle disponibilità** | scheda farmaco | Leaflet + OpenStreetMap, caricata solo se ci sono farmacie con disponibilità. |
| **Segnalazioni della comunità** | `/segnalazioni` | Elenco pubblico delle segnalazioni di mancanza o di risoluzione, filtrabili per città/provincia. |
| **Segnalare una mancanza** | da ogni scheda e da `/segnalazioni` | Chiunque (farmacia, medico, cittadino) può segnalare. Funziona **anche per farmaci non presenti in lista AIFA**, con nome libero. |
| **Dichiarare una risoluzione** | `/segnalazioni` | La farmacia che ha segnalato può chiudere la propria segnalazione come risolta (solo l'autore). Per le segnalazioni anonime provvede la moderazione. |
| **Come funziona** | `/come-funziona` | Trasparenza: da dove arrivano i dati, regole del semaforo, tabella delle fonti con ultima sincronizzazione. |
| **Questionario** | `/parere` | Valutazione in due minuti: utilità, chiarezza, fiducia, cosa manca. |
| **Privacy** | `/privacy` | Informativa GDPR in italiano semplice, con cookie e conservazione. |

**Da provare subito:** AIC `033638204` (ZYPREXA, 🟢) · `041598133` (OLANZAPINA ACCORD, 🟡) · `037350016` (ABIOCLAV, 🔴).

---

## 2. Per le farmacie (area riservata)

| Funzione | Dettaglio |
| --- | --- |
| **Registrazione** | Email, password, denominazione, indirizzo, città, CAP, provincia, telefono, coordinate. Ruolo `farmacia`. |
| **Accesso** | Sessione firmata HMAC, cookie HttpOnly, scadenza 7 giorni. |
| **Dashboard** | Elenco delle proprie disponibilità attive, con scadenza e quantità. |
| **Dichiarare disponibilità** | Ricerca l'AIC, indica livello di scorta (disponibile / scarsa / ultimi pezzi), quantità, nota, data di scadenza. |
| **Ritiro** | La disponibilità scade da sola alla data indicata: nessun dato vecchio resta online. |
| **Segnalazioni collegate** | Le segnalazioni fatte da una farmacia loggata portano il nome della farmacia e il canale "farmacia". |

Le disponibilità di una farmacia **verificata** compaiono con badge "Verificata" e
sono quelle che colorano il semaforo di verde.

---

## 3. Per chi gestisce (amministrazione)

Tutto sotto `/admin`, accessibile solo al ruolo admin o all'email indicata in
`FARMACOMANCANTE_ADMIN_EMAIL`.

| Sezione | Cosa permette |
| --- | --- |
| **Panoramica** | Farmaci in lista, farmacie iscritte e quante non verificate, segnalazioni e disponibilità attive, stato delle fonti con ultimo sync. |
| **Farmacie** | Elenco iscritte, verifica/revoca con un click, e **confronto con l'anagrafe MDM** del Ministero: corrispondenza esatta (codice ministeriale/P.IVA) o probabile (denominazione + comune). |
| **Segnalazioni** | Filtri attive / risolte / nascoste, ricerca libera, moderazione: nascondi, ripristina, segna risolta, elimina. |
| **Pareri** | Medie su utilità, chiarezza e fiducia, composizione del campione per ruolo, testo integrale delle risposte, moderazione ed **export CSV**. |
| **Fonti** | Import manuale della lista AIFA, registro delle fonti con esito e timestamp. |

---

## 4. Cosa fa il sistema da solo

- **Import AIFA automatico.** Scheduler interno: all'avvio recupera la lista se
  l'ultimo sync supera le 20 ore, poi ogni 24 ore. In più endpoint cron
  `/api/cron/importa-aifa` protetto da token Bearer, per Vercel Cron o crontab.
- **Fallback offline.** Se AIFA non risponde, usa il CSV archiviato: il servizio
  resta coerente invece di svuotarsi.
- **Primo avvio su volume vuoto.** Database creato, schema applicato e lista
  importata da sola in pochi secondi.
- **Scadenze automatiche.** Segnalazioni comunitarie: 14 giorni. Disponibilità
  delle farmacie: alla data scelta dalla farmacia.
- **Anti-abuso.** Honeypot nascosto, limiti per IP (segnalazioni 15/h, questionario
  6/h, registrazione 5/h, login 10/15 min), validazione server-side di ogni campo.
- **Health check.** `/api/health` con stato, numero farmaci, freschezza dell'import
  e configurazione: usato dal container e da qualsiasi monitoraggio.

---

## 5. Fiducia e sicurezza

- Password con `scrypt` e salt per utente, confronto a tempo costante.
- Sessioni firmate HMAC, cookie `HttpOnly` + `Secure` in produzione.
- Le aree riservate non sono indicizzabili (`noindex` + `robots.txt`).
- **Le pagine admin validano i permessi prima di leggere il database**: la
  risposta a un non autorizzato non contiene alcun dato (verificato).
- Header di sicurezza su tutto il sito, HSTS in produzione, `X-Powered-By` rimosso.
- Nessun tracker, nessuna analytics di terze parti, nessun font esterno.
- Le disponibilità non verificate restano visibili ma senza badge: la verifica è
  manuale e tracciata.

---

## 6. Limiti da conoscere (dichiarati, non nascosti)

- La verifica delle farmacie è **manuale** in area admin (l'incrocio MDM suggerisce,
  non decide).
- I dati dei grossisti privati non sono integrabili senza accordi: nessun accesso
  ai loro magazzini.
- Le segnalazioni della comunità valgono 14 giorni e non sostituiscono il parere
  del medico o del farmacista.
- Il portale è **informativo**: non prenota, non vende, non gestisce ricette.
- Hosting con disco persistente obbligatorio (SQLite): non è pensato per Vercel
  così com'è.

---

## 7. Numeri al momento della pubblicazione

- 2514 farmaci in elenco, aggiornamento giornaliero automatico
- TTFB 9–17 ms, HTML 8–10 KB compresso, nessuna richiesta a terze parti
- 22 test automatici; typecheck e build eseguiti in CI a ogni push e pull request
- 16 pagine, 15 endpoint API, 8 tabelle nel database

---

*Le informazioni del portale non sostituiscono il parere del medico o del
farmacista. Verificare sempre la disponibilità contattando la farmacia.*
