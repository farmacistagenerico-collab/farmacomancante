/**
 * Configurazione del sito: un unico posto per nome, URL pubblico e contatti.
 * In produzione imposta NEXT_PUBLIC_SITE_URL (es. https://farmacomancante.it)
 * così i metadati, la sitemap e le immagini social puntano all'indirizzo giusto.
 */
const fallbackUrl = "http://localhost:3000";

function normalizeUrl(value: string): string {
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export const site = {
  name: "FarmacoMancante",
  tagline: "Farmaci carenti e disponibilità reali sul territorio",
  description:
    "La lista AIFA dei farmaci temporaneamente carenti, arricchita dalle segnalazioni delle farmacie e della comunità: per medici prescrittori, farmacisti e cittadini.",
  url: normalizeUrl(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackUrl
  ),
  locale: "it_IT",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "info@farmacomancante.it",
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
