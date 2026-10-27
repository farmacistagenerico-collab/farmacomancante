import { cookies } from "next/headers";
import { createPharmacy, getPharmacyByEmail } from "@/lib/db";
import {
  clampText,
  jsonError,
  validateCap,
  validateEmail,
  validatePassword,
  validateProvince,
} from "@/lib/validation";
import { createSessionToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
  licenseCode?: string;
  phone?: string;
  address?: string;
  city?: string;
  cap?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  const limit = rateLimit(`registrazione:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSeconds ?? 60);
  }

  const fields: Record<string, string> = {};
  if (!body.name?.trim()) fields.name = "Nome della farmacia obbligatorio";
  const emailError = validateEmail(body.email ?? "");
  if (emailError) fields.email = emailError;
  const passwordError = validatePassword(body.password ?? "");
  if (passwordError) fields.password = passwordError;
  if (!body.city?.trim()) fields.city = "Città obbligatoria";
  const capError = validateCap(body.cap ?? "");
  if (capError) fields.cap = capError;
  const provinceError = validateProvince(body.province ?? "");
  if (provinceError) fields.province = provinceError;

  if (Object.keys(fields).length > 0) {
    return jsonError(422, "Correggi i campi evidenziati", fields);
  }

  if (getPharmacyByEmail(body.email!)) {
    return jsonError(409, "Esiste già un account con questa email", {
      email: "Email già registrata",
    });
  }

  const pharmacy = createPharmacy({
    email: body.email!,
    passwordHash: hashPassword(body.password!),
    name: body.name!,
    licenseCode: clampText(body.licenseCode, 50),
    phone: clampText(body.phone, 30),
    address: clampText(body.address, 200),
    city: body.city!,
    cap: clampText(body.cap, 5),
    province: body.province ? body.province.trim().toUpperCase() : null,
    lat: typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null,
    lng: typeof body.lng === "number" && Number.isFinite(body.lng) ? body.lng : null,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(pharmacy.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ ok: true, pharmacy: { id: pharmacy.id, name: pharmacy.name } });
}
