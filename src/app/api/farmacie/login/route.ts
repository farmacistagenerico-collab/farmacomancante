import { cookies } from "next/headers";
import { getPharmacyPasswordHash, getPharmacyById } from "@/lib/db";
import { jsonError } from "@/lib/validation";
import { createSessionToken, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return jsonError(422, "Inserisci email e password");
  }

  const limit = rateLimit(`login:${getClientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSeconds ?? 60);
  }

  const record = getPharmacyPasswordHash(email);
  if (!record || !verifyPassword(password, record.passwordHash)) {
    return jsonError(401, "Credenziali non valide");
  }

  const pharmacy = getPharmacyById(record.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(record.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ ok: true, pharmacy: { id: pharmacy?.id, name: pharmacy?.name } });
}
