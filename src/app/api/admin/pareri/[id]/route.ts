import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, isAdmin } from "@/lib/auth";
import { adminDeleteFeedback, getPharmacyById, setFeedbackHidden } from "@/lib/db";
import { jsonError } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const store = await cookies();
  const pharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const admin = pharmacyId ? getPharmacyById(pharmacyId) : null;
  return isAdmin(admin) ? admin : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError(403, "Accesso riservato agli amministratori");

  const { id } = await params;
  const feedbackId = Number(id);
  if (!Number.isInteger(feedbackId)) return jsonError(400, "Id parere non valido");

  let body: { hidden?: boolean };
  try {
    body = (await request.json()) as { hidden?: boolean };
  } catch {
    return jsonError(400, "Richiesta non valida");
  }
  if (typeof body.hidden !== "boolean") {
    return jsonError(422, "Indica se nascondere il parere");
  }
  if (!setFeedbackHidden(feedbackId, body.hidden)) {
    return jsonError(404, "Parere non trovato");
  }
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError(403, "Accesso riservato agli amministratori");

  const { id } = await params;
  const feedbackId = Number(id);
  if (!Number.isInteger(feedbackId)) return jsonError(400, "Id parere non valido");

  if (!adminDeleteFeedback(feedbackId)) return jsonError(404, "Parere non trovato");
  return Response.json({ ok: true });
}
