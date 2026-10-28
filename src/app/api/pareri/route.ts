import { createFeedback } from "@/lib/db";
import { clampText, jsonError } from "@/lib/validation";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import type { FeedbackRecommend, FeedbackRole } from "@/lib/types";

interface FeedbackBody {
  role?: string;
  name?: string;
  email?: string;
  city?: string;
  region?: string;
  ratingUseful?: number;
  ratingClarity?: number;
  ratingTrust?: number;
  recommend?: string;
  usedFeatures?: string[];
  missing?: string;
  comment?: string;
  // Campo esca anti-bot: deve restare vuoto
  website?: string;
}

const ROLES: FeedbackRole[] = ["medico", "farmacista", "cittadino", "altro"];
const RECOMMENDS: FeedbackRecommend[] = ["si", "forse", "no"];
const MAX_FEATURES = 8;

function rating(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export async function POST(request: Request) {
  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return jsonError(400, "Richiesta non valida");
  }

  // Honeypot: i bot compilano tutti i campi, le persone no.
  if (body.website) {
    return jsonError(400, "Richiesta non valida");
  }

  // Massimo 6 questionari all'ora per IP.
  const limit = rateLimit(`pareri:${getClientIp(request)}`, 6, 60 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSeconds ?? 60);
  }

  const fields: Record<string, string> = {};

  const role = ROLES.includes(body.role as FeedbackRole)
    ? (body.role as FeedbackRole)
    : null;
  if (!role) fields.role = "Indica il tuo ruolo";

  const ratingUseful = rating(body.ratingUseful);
  if (ratingUseful === null) fields.ratingUseful = "Valuta l'utilità da 1 a 5";
  const ratingClarity = rating(body.ratingClarity);
  if (ratingClarity === null) fields.ratingClarity = "Valuta la chiarezza da 1 a 5";
  const ratingTrust = rating(body.ratingTrust);
  if (ratingTrust === null) fields.ratingTrust = "Valuta la fiducia da 1 a 5";

  const recommend = RECOMMENDS.includes(body.recommend as FeedbackRecommend)
    ? (body.recommend as FeedbackRecommend)
    : null;
  if (!recommend) fields.recommend = "Indica se lo consiglieresti a un collega";

  const email = clampText(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = "Indirizzo email non valido";
  }

  const usedFeatures = Array.isArray(body.usedFeatures)
    ? body.usedFeatures
        .filter((f): f is string => typeof f === "string")
        .map((f) => clampText(f, 40) ?? "")
        .filter(Boolean)
        .slice(0, MAX_FEATURES)
    : [];

  if (Object.keys(fields).length > 0) {
    return jsonError(422, "Correggi i campi evidenziati", fields);
  }

  const feedback = createFeedback({
    role: role!,
    name: clampText(body.name, 80),
    email,
    city: clampText(body.city, 80),
    region: clampText(body.region, 40),
    ratingUseful: ratingUseful!,
    ratingClarity: ratingClarity!,
    ratingTrust: ratingTrust!,
    recommend: recommend!,
    usedFeatures,
    missing: clampText(body.missing, 500),
    comment: clampText(body.comment, 1000),
  });

  return Response.json({ ok: true, id: feedback.id });
}
