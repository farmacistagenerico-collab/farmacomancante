import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, isAdmin } from "@/lib/auth";
import { getDb, getPharmacyById } from "@/lib/db";
import { importFromAifaRemote } from "@/lib/import";
import { jsonError } from "@/lib/validation";

export async function POST() {
  const store = await cookies();
  const pharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const admin = pharmacyId ? getPharmacyById(pharmacyId) : null;
  if (!isAdmin(admin)) {
    return jsonError(403, "Accesso riservato agli amministratori");
  }

  try {
    const summary = await importFromAifaRemote(getDb());
    return Response.json({ ok: true, summary });
  } catch (err) {
    return jsonError(502, `Importazione non riuscita: ${(err as Error).message}`);
  }
}
