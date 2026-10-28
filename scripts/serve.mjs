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

const root = process.cwd();
const serverFile = path.join(root, ".next", "standalone", "server.js");

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

// Il server.js generato da Next usa i percorsi relativi alla sua cartella.
process.chdir(path.dirname(serverFile));

await import(serverFile);
