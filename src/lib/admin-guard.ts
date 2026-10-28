import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentPharmacy, isAdmin, SESSION_COOKIE, verifySessionToken } from "./auth";
import type { Pharmacy } from "./types";

/**
 * Guardia per le pagine di amministrazione.
 *
 * Serve perché in Next.js App Router la pagina figlia viene renderizzata nello
 * stesso passaggio RSC del layout: se il controllo fosse solo nel layout, i dati
 * della pagina finirebbero comunque nel corpo della risposta (sia pure con
 * stato 307). Chiamando questa funzione come prima istruzione di ogni pagina,
 * il redirect avviene prima di qualsiasi lettura dal database.
 */
export async function requireAdminPage(): Promise<Pharmacy> {
  const pharmacy = await getCurrentPharmacy();
  if (!isAdmin(pharmacy) || !pharmacy) {
    redirect("/area-farmacie/accedi");
  }
  return pharmacy;
}

/** Variante per le API: restituisce null invece di redirigere. */
export async function currentAdmin(): Promise<Pharmacy | null> {
  const store = await cookies();
  const pharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!pharmacyId) return null;
  const pharmacy = await getCurrentPharmacy();
  return isAdmin(pharmacy) ? pharmacy : null;
}
