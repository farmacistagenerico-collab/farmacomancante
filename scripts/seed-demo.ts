/**
 * Popola il database con dati dimostrativi (farmacie, disponibilità, segnalazioni).
 * Uso: FARMACOMANCANTE_ADMIN_EMAIL=admin@farmacomancante.test npx tsx scripts/seed-demo.ts
 * Idempotente: non ricrea le farmacie già presenti.
 */
import {
  createFeedback,
  createPharmacy,
  createShortageReport,
  ensureData,
  getDb,
  getPharmacyByEmail,
  listFeedback,
  setPharmacyVerified,
  upsertAvailability,
} from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const PASSWORD = "password123";

/** Non duplica una segnalazione già presente per lo stesso farmaco. */
function reportExists(drugName: string): boolean {
  return Boolean(
    getDb().prepare("SELECT id FROM shortage_report WHERE drug_name = ? LIMIT 1").get(drugName)
  );
}

function seedReport(input: Parameters<typeof createShortageReport>[0]): void {
  if (reportExists(input.drugName)) {
    console.log(`segnalazione ${input.drugName} già presente, salto`);
    return;
  }
  createShortageReport(input);
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await ensureData();

  const adminEmail = "admin@farmacomancante.test";
  if (!getPharmacyByEmail(adminEmail)) {
    createPharmacy({
      email: adminEmail,
      passwordHash: hashPassword(PASSWORD),
      name: "Amministrazione FarmacoMancante",
      city: "Sirmione",
      province: "BS",
    });
    console.log("creato account admin");
  }

  let demo = getPharmacyByEmail("farmacia@farmacomancante.test");
  if (!demo) {
    demo = createPharmacy({
      email: "farmacia@farmacomancante.test",
      passwordHash: hashPassword(PASSWORD),
      name: "Farmacia Del Porto",
      licenseCode: "BS-0452",
      address: "Via Vittorio Emanuele 12",
      city: "Sirmione",
      cap: "25019",
      province: "BS",
      phone: "030 9900000",
      lat: 45.4891,
      lng: 10.6076,
    });
    console.log("creata farmacia demo");
  }
  setPharmacyVerified(demo.id, true);

  // Disponibilità reale dichiarata dalla farmacia verificata (verde)
  upsertAvailability({
    pharmacyId: demo.id,
    aic: "033638204",
    stockLevel: "disponibile",
    quantityLabel: "3 confezioni",
    note: "Ritiro in sede, documento richiesto",
    expiresAt: daysFromNow(19),
  });
  console.log("disponibilità ZYPREXA inserita");

  // Segnalazione di risoluzione (giallo)
  seedReport({
    pharmacyId: demo.id,
    reporterRole: "farmacia",
    reporterName: "Farmacia Del Porto",
    aic: "041598133",
    drugName: "OLANZAPINA ACCORD",
    city: "Sirmione",
    province: "BS",
    channel: "farmacia",
    signal: "risoluzione",
    note: "Riassortimento riuscito, scorte normali in provincia di Brescia.",
    expiresAt: daysFromNow(14),
  });

  // Segnalazione di mancanza (rosso)
  seedReport({
    reporterRole: "cittadino",
    reporterName: "Luca",
    aic: "037350016",
    drugName: "ABIOCLAV",
    city: "Desenzano del Garda",
    province: "BS",
    channel: "farmacia",
    signal: "mancante",
    note: "Cercato in tre farmacie del basso Garda, nessuna disponibilità.",
    expiresAt: daysFromNow(14),
  });

  // Segnalazione libera per un farmaco fuori lista AIFA
  seedReport({
    reporterRole: "medico",
    reporterName: "Dott.ssa Rossi",
    drugName: "ESEMPIO NON LISTA AIFA",
    activeIngredient: "principio attivo di esempio",
    city: "Peschiera del Garda",
    province: "VR",
    channel: "farmacia",
    signal: "mancante",
    note: "Prodotto non presente nell'elenco AIFA, segnalato dai pazienti.",
    expiresAt: daysFromNow(14),
  });

  console.log("segnalazioni demo inserite");

  // Pareri dimostrativi: mostrano la vista /admin/pareri già popolata.
  if (listFeedback({ includeHidden: true }).length === 0) {
    createFeedback({
      role: "medico",
      name: "Dott. Marco Rossi",
      email: "marco.rossi@example.it",
      city: "Brescia",
      ratingUseful: 5,
      ratingClarity: 4,
      ratingTrust: 4,
      recommend: "si",
      usedFeatures: ["Ricerca farmaco", "Semaforo delle carenze"],
      missing: "Un filtro per regione e un avviso via email quando un farmaco torna disponibile.",
      comment:
        "In studio mi fa risparmiare il giro di telefonate alle farmacie. La scheda con le indicazioni AIFA è la parte più utile.",
    });
    createFeedback({
      role: "farmacista",
      name: "Farmacia San Rocco",
      city: "Desenzano del Garda",
      ratingUseful: 4,
      ratingClarity: 5,
      ratingTrust: 3,
      recommend: "forse",
      usedFeatures: ["Disponibilità delle farmacie"],
      missing: "L'incrocio automatico con il magazzino del grossista, per non dover inserire tutto a mano.",
      comment:
        "Utile ai cittadini, ma mi fido di più quando il dato arriva da un sistema collegato invece che a mano.",
    });
    console.log("pareri demo inseriti");
  } else {
    console.log("pareri già presenti, salto");
  }
}

main().then(() => process.exit(0));
