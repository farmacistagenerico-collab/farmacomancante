/**
 * Hook di Next.js eseguito all'avvio del runtime Node.
 * Documentazione: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startScheduler } = await import("@/lib/scheduler");
  startScheduler();

  // Popola subito il database se il volume è vuoto (CSV locale o incluso
  // nell'immagine), così il primo avvio in produzione non serve una pagina
  // visitata per avere i dati. Non blocca l'avvio del server.
  const { ensureData } = await import("@/lib/db");
  void ensureData()
    .then(() => console.log("[avvio] dati AIFA verificati"))
    .catch((err) => console.error("[avvio] import iniziale non riuscito:", err));
}
