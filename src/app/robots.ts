import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Dinamico: l'URL pubblico arriva dall'ambiente, non va congelato nel build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = site.url;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Aree riservate: niente indicizzazione di sessioni e moderazione.
        disallow: ["/admin", "/admin/", "/area-farmacie/dashboard", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
