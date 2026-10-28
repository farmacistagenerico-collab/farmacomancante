import type { MetadataRoute } from "next";
import { ensureData, listDrugAics } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/farmaci`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/segnalazioni`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${site.url}/come-funziona`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/parere`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    await ensureData();
    const aics = listDrugAics();
    return [
      ...staticPages,
      ...aics.map((aic) => ({
        url: `${site.url}/farmaci/${aic}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Se il database non è ancora pronto la sitemap resta valida con le pagine fisse.
    return staticPages;
  }
}
