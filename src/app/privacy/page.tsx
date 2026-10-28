import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy e trattamento dei dati",
  description:
    "Quali dati raccoglie FarmacoMancante, perché, per quanto tempo vengono conservati e come esercitare i diritti previsti dal GDPR.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "Titolare del trattamento",
    body: `FarmacoMancante è un progetto informativo indipendente. Per qualsiasi richiesta relativa ai dati personali puoi scrivere a ${site.contactEmail}.`,
  },
  {
    title: "Dati raccolti",
    body: "Registrazione delle farmacie: email, password (conservata solo come hash), denominazione, indirizzo, città, CAP, provincia, telefono e, se fornite, coordinate geografiche. Segnalazioni della comunità: ruolo dichiarato, nome visualizzato facoltativo, città, provincia, farmaco e nota. Dati tecnici: indirizzo IP in forma non persistita, usato solo per limitare gli abusi.",
  },
  {
    title: "Finalità e base giuridica",
    body: "I dati delle farmacie servono a pubblicare disponibilità verificate (esecuzione del servizio richiesto). Le segnalazioni della comunità servono a informare il pubblico sullo stato delle carenze (interesse legittimo a un'informazione sanitaria corretta). I dati tecnici servono a prevenire abusi (interesse legittimo alla sicurezza del servizio).",
  },
  {
    title: "Cosa è pubblico",
    body: "Della farmacia sono visibili denominazione, indirizzo, città, telefono e disponibilità dichiarate. L'indirizzo email della farmacia non è mai mostrato pubblicamente. Delle segnalazioni sono visibili il nome visualizzato scelto dall'autore (se indicato), la città, la provincia e il contenuto della nota.",
  },
  {
    title: "Conservazione",
    body: "Le segnalazioni della comunità scadono automaticamente dopo 14 giorni. Le disponibilità delle farmacie scadono alla data indicata dalla farmacia stessa. Gli account delle farmacie restano attivi finché la farmacia non ne chiede la cancellazione.",
  },
  {
    title: "Cookie",
    body: "È usato un solo cookie tecnico di sessione (fm_session), necessario per l'accesso all'area riservata delle farmacie: è HttpOnly, non tracciante e non richiede consenso. Non utilizziamo cookie pubblicitari, profilazione o strumenti di analytics di terze parti.",
  },
  {
    title: "Destinatari e trasferimenti",
    body: "I dati sono ospitati sul provider che eroga il servizio. Non vengono venduti né comunicati a terzi per finalità commerciali. Le mappe sono renderizzate con dati OpenStreetMap caricati dal browser dell'utente.",
  },
  {
    title: "Diritti dell'interessato",
    body: `Puoi chiedere accesso, rettifica, cancellazione, limitazione e opposizione al trattamento scrivendo a ${site.contactEmail}. Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali.`,
  },
  {
    title: "Natura dei dati sanitari",
    body: "Il portale non raccoglie dati relativi alla salute degli utenti e non richiede di indicare la patologia per cui un farmaco è prescritto. Ti invitiamo a non inserire informazioni sanitarie personali nelle note delle segnalazioni.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Informazioni legali
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Privacy e trattamento dei dati</h1>
        <p className="mt-4 text-lg text-slate-600">
          Versione sintetica e in linguaggio chiaro dell'informativa resa ai sensi degli
          articoli 13 e 14 del Regolamento (UE) 2016/679.
        </p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title} className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Nota per chi pubblica il portale</p>
          <p className="mt-1">
            Questo testo è un modello di partenza: prima della pubblicazione va adattato
            con i dati reali del titolare (denominazione, indirizzo, contatti) e
            verificato da chi ne assume la responsabilità.
          </p>
        </div>
      </div>
    </div>
  );
}
