import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { resolveShortageReport } from "@/lib/db";
import { jsonError } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Solo la farmacia autrice può chiudere una propria segnalazione */
export async function PATCH(_request: Request, { params }: RouteContext) {
  const store = await cookies();
  const pharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!pharmacyId) {
    return jsonError(401, "Sessione scaduta, accedi di nuovo");
  }

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return jsonError(400, "Id segnalazione non valido");
  }

  const changed = resolveShortageReport(reportId, pharmacyId);
  if (!changed) {
    return jsonError(404, "Segnalazione non trovata o non modificabile");
  }
  return Response.json({ ok: true });
}
