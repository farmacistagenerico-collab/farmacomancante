import { getDb } from "@/lib/db";
import { importFromAifaRemote } from "@/lib/import";
import { verifyCronAuthorization } from "@/lib/auth";

/**
 * Endpoint per cron esterni (es. Vercel Cron, crontab, GitHub Actions).
 * Richiede: Authorization: Bearer <FARMACOMANCANTE_CRON_SECRET|FARMACOMANCANTE_SECRET>
 */
async function handle(request: Request) {
  if (!verifyCronAuthorization(request.headers.get("authorization"))) {
    return Response.json({ ok: false, message: "Non autorizzato" }, { status: 401 });
  }
  const summary = await importFromAifaRemote(getDb());
  return Response.json({ ok: true, summary });
}

export const GET = handle;
export const POST = handle;
