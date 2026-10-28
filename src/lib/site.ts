/**
 * Configurazione del sito: un unico posto per nome, URL pubblico e contatti.
 *
 * L'URL pubblico è letto in ordine di priorità:
 *
 * 1. `FARMACOMANCANTE_SITE_URL` — variabile *di runtime*, impostabile dopo la
 *    build (Render, Fly, Docker con `-e`, VPS). È il modo consigliato in
 *    produzione: su un PaaS il valore non è noto in fase di build.
 * 2. `NEXT_PUBLIC_SITE_URL` — incorporata nel bundle in fase di build, utile
 *    in locale o nei container costruiti per un dominio già noto.
 * 3. `http://localhost:3000` — sviluppo.
 *
 * Questo modulo è usato solo da componenti server (layout, sitemap, robots,
 * manifest, footer), quindi la lettura avviene a ogni richiesta.
 */
const fallbackUrl = "http://localhost:3000";

/**
 * Normalizza l'URL pubblico: aggiunge https:// se manca lo schema e rimuove
 * gli slash finali, così canonical, sitemap e Open Graph non producono mai
 * indirizzi con "//".
 */
export function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallbackUrl;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const candidates = [
    process.env.FARMACOMANCANTE_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return normalizeSiteUrl(value);
  }
  return fallbackUrl;
}

export const site = {
  name: "FarmacoMancante",
  tagline: "Farmaci carenti e disponibilità reali sul territorio",
  description:
    "La lista AIFA dei farmaci temporaneamente carenti, arricchita dalle segnalazioni delle farmacie e della comunità: per medici prescrittori, farmacisti e cittadini.",
  url: resolveSiteUrl(),
  locale: "it_IT",
  contactEmail:
    process.env.FARMACOMANCANTE_CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "info@farmacomancante.it",
  keywords: [
    "farmaci carenti",
    "carenza farmaci",
    "AIFA",
    "lista farmaci carenti",
    "disponibilità farmaci",
    "farmacie",
    "medici prescrittori",
  ],
} as const;
