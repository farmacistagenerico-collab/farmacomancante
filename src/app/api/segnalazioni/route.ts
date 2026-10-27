import { cookies } from "next/headers";
import {
  createShortageReport,
  getDrugByAic,
  getPharmacyById,
} from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import {
  clampText,
  jsonError,
  validateProvince,
  validateReportChannel,
  validateReporterRole,
  validateShortageSignal,
} from "@/lib/validation";
import { isoPlusDays, REPORT_TTL_DAYS } from "@/lib/format";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import type { ReportChannel, ReporterRole, ShortageSignal } from "@/lib/types";

interface ReportBody {
  aic?: string;
  drugName?: string;
  activeIngredient?: string;
  city?: string;
  province?: string;
  reporterRole?: string;
  reporterName?: string;
  channel?: string;
  signal?: string;
  note?: string;
  // Campo esca anti-bot: deve restare vuoto
  website?: string;
}

export async function POST(request: Request) {
  let body: ReportBody;
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  // Honeypot: rifiuta silenziosamente i bot che compilano tutto
  if (body.website) {
    return jsonError(400, "Richiesta non valida");
  }

  // Massimo 15 segnalazioni/ora per IP: protegge da flood e spam
  const limit = rateLimit(`segnalazioni:${getClientIp(request)}`, 15, 60 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSeconds ?? 60);
  }

  const store = await cookies();
  const sessionPharmacyId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const pharmacy = sessionPharmacyId ? getPharmacyById(sessionPharmacyId) : null;

  const fields: Record<string, string> = {};

  const signalError = validateShortageSignal(body.signal);
  if (signalError) fields.signal = signalError;
  const channelError = validateReportChannel(body.channel);
  if (channelError) fields.channel = channelError;

  let reporterRole: ReporterRole;
  if (pharmacy) {
    reporterRole = "farmacia";
  } else {
    const roleError = validateReporterRole(body.reporterRole);
    if (roleError) fields.reporterRole = roleError;
    reporterRole = body.reporterRole as ReporterRole;
  }

  // Risoluzione del farmaco: AIC ufficiale oppure nome libero
  let aic: string | null = null;
  let drugName = clampText(body.drugName, 200);
  let activeIngredient = clampText(body.activeIngredient, 200);

  if (body.aic?.trim()) {
    const drug = getDrugByAic(body.aic.trim());
    if (!drug) {
      fields.aic = "Farmaco non presente nella lista carenti";
    } else {
      aic = drug.aic;
      drugName = drug.name;
      activeIngredient = drug.activeIngredient;
    }
  } else if (!drugName || drugName.length < 2) {
    fields.drugName = "Indica il nome del farmaco (minimo 2 caratteri)";
  }

  let city = clampText(body.city, 100);
  if (!city && pharmacy) city = pharmacy.city;
  if (!city) fields.city = "Indica la città in cui manca il farmaco";

  const provinceError = validateProvince(body.province ?? "");
  if (provinceError) fields.province = provinceError;

  if (Object.keys(fields).length > 0) {
    return jsonError(422, "Correggi i campi evidenziati", fields);
  }

  const report = createShortageReport({
    pharmacyId: pharmacy?.id ?? null,
    reporterRole,
    reporterName: pharmacy ? pharmacy.name : clampText(body.reporterName, 100),
    aic,
    drugName: drugName!,
    activeIngredient,
    city,
    province: body.province ? body.province.trim().toUpperCase() : null,
    channel: body.channel as ReportChannel,
    signal: body.signal as ShortageSignal,
    note: clampText(body.note, 300),
    expiresAt: isoPlusDays(REPORT_TTL_DAYS),
  });

  return Response.json({
    ok: true,
    report: { id: report.id, expiresAt: report.expiresAt },
    ttlDays: REPORT_TTL_DAYS,
  });
}
