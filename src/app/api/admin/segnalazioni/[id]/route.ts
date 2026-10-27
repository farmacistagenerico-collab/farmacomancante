import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, isAdmin } from "@/lib/auth";
import {
  adminDeleteReport,
  getPharmacyById,
  resolveShortageReport,
  setReportHidden,
} from "@/lib/db";
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
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) return jsonError(400, "Id segnalazione non valido");

  let body: { hidden?: boolean; resolve?: boolean };
  try {
    body = (await request.json()) as { hidden?: boolean; resolve?: boolean };
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  if (typeof body.hidden === "boolean") {
    setReportHidden(reportId, body.hidden);
  }
  if (body.resolve) {
    resolveShortageReport(reportId, admin.id);
  }
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError(403, "Accesso riservato agli amministratori");

  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) return jsonError(400, "Id segnalazione non valido");

  if (!adminDeleteReport(reportId)) return jsonError(404, "Segnalazione non trovata");
  return Response.json({ ok: true });
}
