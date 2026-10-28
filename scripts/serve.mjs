#!/usr/bin/env node
/**
 * Avvia il server di produzione standalone.
 *
 * Perché non `next start`: con `output: "standalone"` Next segnala che quel
 * comando non è il runtime previsto. Questo script imposta le variabili e
 * carica lo stesso server.js usato dal container, così locale, CI e Docker
 * eseguono esattamente lo stesso codice.
 *
 *   npm run build && npm start            # http://localhost:3000
 *   PORT=8080 HOSTNAME=0.0.0.0 npm start
 */
import fs from "node:fs";
import path from "node:path";

// Radice del progetto: va letta PRIMA del chdir, perché serve a calcolare
// il percorso dei dati.
const projectRoot = process.cwd();
const standaloneDir = path.join(projectRoot, ".next", "standalone");
const serverFile = path.join(standaloneDir, "server.js");

if (!fs.existsSync(serverFile)) {
  console.error(
    "[start] server standalone non trovato.\n" +
      "        Esegui prima:  npm run build\n" +
      "        (lo script postbuild prepara .next/standalone)\n" +
      `        Cercato in: ${serverFile}`
  );
  process.exit(1);
}

process.env.NODE_ENV = "production";
process.env.PORT = process.env.PORT ?? "3000";
process.env.HOSTNAME = process.env.HOSTNAME ?? "0.0.0.0";

// IMPORTANTE: il server standalone deve girare con cwd = sua cartella, ma il
// database deve restare in <progetto>/data. Senza questa riga il chdir qui
// sotto sposterebbe i dati in .next/standalone/data, creando un secondo
// database vuoto e "sparendo" farmacie e segnalazioni.
if (!process.env.FARMACOMANCANTE_DATA_DIR) {
  process.env.FARMACOMANCANTE_DATA_DIR = path.join(projectRoot, "data");
}
console.log(`[start] database e segreti in ${process.env.FARMACOMANCANTE_DATA_DIR}`);

process.chdir(standaloneDir);
await import(serverFile);
