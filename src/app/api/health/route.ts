import { getLatestBatch, getStats } from "@/lib/db";
import { hasConfiguredSecret } from "@/lib/auth";
import { dataDir, isProduction } from "@/lib/paths";

/**
 * Health check per il monitoraggio e per il healthcheck del container.
 * Non espone segreti: solo stato sintetico del servizio e dei dati.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const stats = getStats();
    const batch = getLatestBatch();
    const lastImport = batch?.importedAt ? new Date(batch.importedAt) : null;
    const hoursSinceImport = lastImport
      ? Math.round(((Date.now() - lastImport.getTime()) / 3_600_000) * 10) / 10
      : null;

    // I dati sono "freschi" se l'ultimo import è più recente di 48 ore.
    const dataFresh = hoursSinceImport !== null && hoursSinceImport <= 48;
    const healthy = stats.drugCount > 0;
    // Nei primi minuti di vita un volume nuovo sta ancora importando la lista
    // AIFA: non è un guasto e il container non deve riavviarsi.
    const booting = !healthy && process.uptime() < 180;

    return Response.json(
      {
        status: healthy ? "ok" : booting ? "starting" : "degraded",
        version: process.env.npm_package_version ?? "1.0.0",
        env: process.env.NODE_ENV,
        production: isProduction(),
        data: {
          drugs: stats.drugCount,
          pharmacies: stats.pharmacyCount,
          activeAvailability: stats.activeAvailabilityCount,
          activeReports: stats.activeReportCount,
          lastImportAt: batch?.importedAt ?? null,
          listDate: batch?.listDate ?? null,
          hoursSinceImport,
          fresh: dataFresh,
          directory: isProduction() ? undefined : dataDir(),
        },
        config: {
          adminEmailConfigured: Boolean(process.env.FARMACOMANCANTE_ADMIN_EMAIL),
          cronSecretConfigured: Boolean(
            process.env.FARMACOMANCANTE_CRON_SECRET || hasConfiguredSecret()
          ),
          sessionSecretFromEnv: hasConfiguredSecret(),
        },
        uptimeSeconds: Math.round(process.uptime()),
        responseMs: Date.now() - startedAt,
      },
      {
        status: healthy || booting ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return Response.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "errore sconosciuto",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
