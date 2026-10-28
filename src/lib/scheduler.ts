import { getDb, getLatestBatch } from "./db";
import { importFromAifaRemote } from "./import";

type GlobalWithScheduler = typeof globalThis & { __fmSchedulerStarted?: boolean };

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const STARTUP_DELAY_MS = 45 * 1000;

/**
 * Schedulatore interno: una volta al giorno tenta l'aggiornamento della lista
 * AIFA dalla fonte remota (con fallback sul CSV locale). All'avvio recupera
 * solo se l'ultimo sync è più vecchio di 20 ore.
 *
 * Disattivabile con FARMACOMANCANTE_SCHEDULER=off. Per ambienti serverless
 * esiste anche l'endpoint cron protetto /api/cron/importa-aifa.
 */
export function startScheduler(): void {
  const g = globalThis as GlobalWithScheduler;
  if (g.__fmSchedulerStarted) return;
  if (process.env.FARMACOMANCANTE_SCHEDULER === "off") return;
  g.__fmSchedulerStarted = true;

  const runImport = async (trigger: string) => {
    try {
      const summary = await importFromAifaRemote(getDb());
      console.log(
        `[scheduler] import AIFA (${trigger}): ${summary.inserted} inseriti, ${summary.updated} aggiornati, lista ${summary.listDate ?? "n/d"}`
      );
    } catch (err) {
      console.error("[scheduler] import AIFA fallito:", err);
    }
  };

  setTimeout(() => {
    const batch = getLatestBatch();
    const stale =
      !batch?.importedAt ||
      Date.now() - new Date(batch.importedAt).getTime() > 20 * ONE_HOUR;
    if (stale) void runImport("avvio");
  }, STARTUP_DELAY_MS);

  setInterval(() => void runImport("giornaliero"), ONE_DAY);
}
