// Niente dipendenze runtime: bastano i Request standard delle route handler.

/**
 * Rate limiting in memoria a finestra fissa, sufficiente per un'istanza singola.
 * Se il portale venisse scalato su più istanze andrà spostato su Redis/SQLite.
 */
interface Bucket {
  start: number;
  count: number;
}

const buckets = new Map<string, Bucket>();
const SWEEP_EVERY_MS = 5 * 60 * 1000;
let lastSweep = 0;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number | null;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (now - lastSweep > SWEEP_EVERY_MS) {
    for (const [k, b] of buckets) {
      if (now - b.start >= windowMs) buckets.delete(k);
    }
    lastSweep = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.start >= windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: null };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.start + windowMs - now) / 1000),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: null };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "sconosciuto";
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    {
      ok: false,
      message: "Troppe richieste: riprova tra qualche minuto",
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
