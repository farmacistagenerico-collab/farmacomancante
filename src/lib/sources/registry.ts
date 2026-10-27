/**
 * Registro delle fonti dati. Le fonti "external" sono quelle pubbliche
 * ufficiali (AIFA, Ministero della Salute); "community" raccoglie le
 * segnalazioni degli utenti; "internal" le disponibilità delle farmacie.
 *
 * Per ogni fonte esterna esiste un adattatore in src/lib/sources/ o uno
 * script in scripts/ che popola external_signal e aggiorna last_sync_at.
 */
export const SOURCE_REGISTRY = [
  {
    code: "aifa",
    name: "AIFA — Lista farmaci temporaneamente carenti",
    description:
      "Elenco ufficiale CSV delle carenze, con motivazioni, equivalenti e indicazioni terapeutiche.",
    kind: "external",
  },
  {
    code: "mdm-farmacie",
    name: "Ministero della Salute — Anagrafe farmacie (open data)",
    description:
      "Elenco ufficiale delle farmacie con codice ministeriale, P.IVA e localizzazione. Usato per validare le farmacie iscritte.",
    kind: "external",
  },
  {
    code: "mdm-distributori",
    name: "Ministero della Salute — Distributori di farmaci (open data)",
    description:
      "Anagrafe dei grossisti/siti logistici: base futura per l'incrocio con le disponibilità di magazzino.",
    kind: "external",
  },
  {
    code: "comunita",
    name: "Segnalazioni della comunità",
    description:
      "Segnalazioni di mancanza o di rientro inviate da farmacie, medici e cittadini.",
    kind: "community",
  },
  {
    code: "disponibilita-farmacie",
    name: "Disponibilità delle farmacie",
    description:
      "Conferme di disponibilità temporanea inserite dalle farmacie iscritte al portale.",
    kind: "internal",
  },
] as const;

export type SourceCode = (typeof SOURCE_REGISTRY)[number]["code"];

/** URL pubblico stabile del CSV AIFA (nome file invariato negli aggiornamenti). */
export const AIFA_CSV_URL =
  "https://www.aifa.gov.it/documents/20142/847339/elenco_medicinali_carenti.csv";

/** Dataset open data del Ministero della Salute. */
export const MDM_FARMACIE_DATASET =
  "https://www.dati.salute.gov.it/it/dataset/farmacie/";
export const MDM_DISTRIBUTORI_DATASET =
  "https://www.dati.salute.gov.it/it/dataset/distributori-di-farmaci-con-dettaglio-autorizzazioni/";
