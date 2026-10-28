#!/usr/bin/env node
/**
 * Prepara il pacchetto standalone dopo `next build`.
 *
 * Next genera .next/standalone/server.js ma non copia gli asset che il server
 * deve servire: public/, .next/static e i file dati necessari al primo avvio.
 * Questo script fa quelle copie, così `npm start` e il Dockerfile usano lo
 * stesso percorso verificato.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

function copyDir(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`[standalone] cartella assente, salto: ${from}`);
    return;
  }
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[standalone] copiato ${path.relative(root, from)} → ${path.relative(root, to)}`);
}

function copyFile(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`[standalone] copiato ${path.relative(root, from)} → ${path.relative(root, to)}`);
}

if (!fs.existsSync(standalone)) {
  console.error("[standalone] .next/standalone assente: manca `output: \"standalone\"` in next.config?");
  process.exit(1);
}

copyDir(path.join(root, "public"), path.join(standalone, "public"));
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));

// Schema SQL e CSV AIFA: servono se il volume dati è vuoto (primo avvio).
copyFile(path.join(root, "src", "lib", "schema.sql"), path.join(standalone, "schema.sql"));
copyFile(
  path.join(root, "assets", "elenco_medicinali_carenti.csv"),
  path.join(standalone, "assets", "elenco_medicinali_carenti.csv")
);

console.log("[standalone] pacchetto pronto");
