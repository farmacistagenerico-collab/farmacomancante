import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getDrugByAic, upsertAvailability, deleteAvailability } from "@/lib/db";
import { clampText, jsonError, validateFutureDate } from "@/lib/validation";
import { STOCK_LEVEL_ORDER } from "@/lib/format";
import type { StockLevel } from "@/lib/types";

async function requirePharmacyId(): Promise<number | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function POST(request: Request) {
  const pharmacyId = await requirePharmacyId();
  if (!pharmacyId) {
    return jsonError(401, "Sessione scaduta, accedi di nuovo");
  }

  let body: {
    aic?: string;
    stockLevel?: string;
    quantityLabel?: string;
    note?: string;
    expiresAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  const fields: Record<string, string> = {};
  const aic = body.aic?.trim() ?? "";
  if (!aic) fields.aic = "Seleziona un farmaco";
  else if (!getDrugByAic(aic)) fields.aic = "Farmaco non presente nella lista carenti";

  const stockLevel = body.stockLevel as StockLevel;
  if (!STOCK_LEVEL_ORDER.includes(stockLevel)) {
    fields.stockLevel = "Livello di disponibilità non valido";
  }

  const expiresAt = body.expiresAt ?? "";
  const dateError = validateFutureDate(expiresAt);
  if (dateError) fields.expiresAt = dateError;

  if (Object.keys(fields).length > 0) {
    return jsonError(422, "Correggi i campi evidenziati", fields);
  }

  const availability = upsertAvailability({
    pharmacyId,
    aic,
    stockLevel,
    quantityLabel: clampText(body.quantityLabel, 100),
    note: clampText(body.note, 300),
    expiresAt,
  });

  return Response.json({ ok: true, availability });
}

export async function DELETE(request: NextRequest) {
  const pharmacyId = await requirePharmacyId();
  if (!pharmacyId) {
    return jsonError(401, "Sessione scaduta, accedi di nuovo");
  }
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return jsonError(400, "Id segnalazione non valido");
  }
  const removed = deleteAvailability(id, pharmacyId);
  if (!removed) {
    return jsonError(404, "Segnalazione non trovata");
  }
  return Response.json({ ok: true });
}
