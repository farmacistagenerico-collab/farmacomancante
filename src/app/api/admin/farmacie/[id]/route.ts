import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, isAdmin } from "@/lib/auth";
import { getPharmacyById, setPharmacyVerified } from "@/lib/db";
import { jsonError } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const store = await cookies();
  const pharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const admin = pharmacyId ? getPharmacyById(pharmacyId) : null;
  if (!isAdmin(admin)) {
    return jsonError(403, "Accesso riservato agli amministratori");
  }

  const { id } = await params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId)) {
    return jsonError(400, "Id farmacia non valido");
  }

  let body: { verified?: boolean };
  try {
    body = (await request.json()) as { verified?: boolean };
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  const changed = setPharmacyVerified(targetId, Boolean(body.verified));
  if (!changed) return jsonError(404, "Farmacia non trovata");
  return Response.json({ ok: true, verified: Boolean(body.verified) });
}
