import type { Metadata } from "next";
import Link from "next/link";
import { ensureData, getStats, listSources } from "@/lib/db";
import { formatDateIT } from "@/lib/format";

export const metadata: Metadata = {
  title: "Come funziona",
  description:
    "Da dove arrivano i dati, come viene calcolato il semaforo delle carenze e come vengono verificate le farmacie che segnalano disponibilità.",
  alternates: { canonical: "/come-funziona" },
};

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "1. La lista ufficiale AIFA",
    body: "Ogni giorno importiamo l'elenco dei medicinali temporaneamente carenti pubblicato da AIFA: nome, AIC, principio attivo, date di inizio e fine presunta della carenza, equivalenti e indicazioni terapeutiche.",
  },
  {
    title: "2. Le segnalazioni delle farmacie",
    body: "Le farmacie registrate, dopo la verifica dell'account, dichiarano la disponibilità residua di un prodotto con una scadenza automatica: nessuna informazione resta online oltre il termine indicato.",
  },
  {
    title: "3. La voce della comunità",
    body: "Chiunque può segnalare che un farmaco manca o che la carenza è superata, anche per prodotti non presenti nella lista AIFA. Le segnalazioni durano 14 giorni e passano dalla moderazione.",
  },
  {
    title: "4. Il semaforo",
    body: "Incrociamo le fonti e assegniamo uno stato unico a ogni AIC: verde se una farmacia verificata ha disponibilità attiva, giallo se ci sono segnali di risoluzione o la fine presunta è passata, rosso negli altri casi.",
  },
];

const RULES = [
  {
    color: "bg-emerald-500",
    label: "Verde — disponibile",
    body: "Almeno una farmacia ha dichiarato una disponibilità ancora valida. La precedenza è assoluta: un dato di magazzino conta più di qualsiasi altra fonte.",
  },
  {
    color: "bg-amber-500",
    label: "Giallo — in risoluzione",
    body: "La carenza sta rientrando: c'è una segnalazione di risoluzione attiva oppure la data di fine presunta indicata da AIFA è già trascorsa.",
  },
  {
    color: "bg-red-500",
    label: "Rosso — carente",
    body: "Nessun segnale di disponibilità né di risoluzione: il farmaco resta nell'elenco AIFA dei medicinali carenti.",
  },
];

export default async function ComeFunzionaPage() {
  await ensureData();
  const stats = getStats();
  const sources = listSources();

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Trasparenza
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Come funziona il portale</h1>
        <p className="mt-4 text-lg text-slate-600">
          FarmacoMancante non inventa dati: aggrega una fonte ufficiale, le segnalazioni
          verificabili delle farmacie e quelle della comunità, e rende esplicito da dove
          arriva ogni informazione.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-2xl font-bold text-brand-700">
              {stats.drugCount.toLocaleString("it-IT")}
            </p>
            <p className="mt-1 text-sm text-slate-500">farmaci nell'elenco AIFA</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-bold text-brand-700">
              {stats.pharmacyCount.toLocaleString("it-IT")}
            </p>
            <p className="mt-1 text-sm text-slate-500">farmacie registrate</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-bold text-brand-700">
              {stats.activeReportCount.toLocaleString("it-IT")}
            </p>
            <p className="mt-1 text-sm text-slate-500">segnalazioni attive</p>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Il percorso del dato</h2>
          <ol className="mt-6 space-y-4">
            {STEPS.map((step) => (
              <li key={step.title} className="card p-5">
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Come leggere il semaforo</h2>
          <ul className="mt-6 space-y-4">
            {RULES.map((rule) => (
              <li key={rule.label} className="card flex gap-4 p-5">
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${rule.color}`}
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-semibold text-slate-900">{rule.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">{rule.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Le fonti monitorate</h2>
          <div className="table-wrap mt-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Fonte</th>
                  <th>Tipo</th>
                  <th>Ultima sincronizzazione</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.code}>
                    <td>
                      <p className="font-medium text-slate-900">{source.name}</p>
                      <p className="text-xs text-slate-500">{source.description}</p>
                    </td>
                    <td className="text-sm text-slate-600">
                      {source.kind === "external"
                        ? "Ufficiale"
                        : source.kind === "community"
                          ? "Comunitaria"
                          : "Interna"}
                    </td>
                    <td className="text-sm text-slate-600">
                      {source.lastSyncAt
                        ? formatDateIT(source.lastSyncAt.slice(0, 10))
                        : "mai"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 card bg-brand-50 p-6">
          <h2 className="text-xl font-bold">Vuoi dare un parere?</h2>
          <p className="mt-2 text-sm text-slate-700">
            Sei un medico, un farmacista o un cittadino che ha usato il portale? Un
            questionario di due minuti ci aiuta a capire cosa migliorare.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/parere" className="btn-primary">
              Rispondi al questionario
            </Link>
            <Link href="/segnalazioni" className="btn-secondary">
              Vedi le segnalazioni
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
