import Link from "next/link";
import { ensureData, getLatestBatch, getStats } from "@/lib/db";
import { formatDateIT } from "@/lib/format";
import { SearchForm } from "@/components/SearchForm";

export default async function HomePage() {
  await ensureData();
  const stats = getStats();
  const batch = getLatestBatch();

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-app py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            {batch && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
                Lista AIFA aggiornata al {formatDateIT(batch.listDate)}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              I farmaci carenti, finalmente mappati
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Consulta la lista ufficiale dei medicinali temporaneamente carenti e
              scopri quali farmacie sul territorio ne hanno ancora disponibilità.
            </p>
            <div className="mt-8">
              <SearchForm large />
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-brand-700 sm:text-3xl">
                  {stats.drugCount.toLocaleString("it-IT")}
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">farmaci in carenza</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-700 sm:text-3xl">
                  {stats.activeAvailabilityCount.toLocaleString("it-IT")}
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">disponibilità attive</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-700 sm:text-3xl">
                  {stats.pharmacyCount.toLocaleString("it-IT")}
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">farmacie iscritte</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destinatari */}
      <section className="container-app py-14">
        <h2 className="text-center text-2xl font-bold">A chi è rivolto</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Medici prescrittori</h3>
            <p className="mt-2 text-sm text-slate-600">
              Verificate in pochi secondi se un medicinale è carente, se esiste un
              equivalente e quali sono le indicazioni terapeutiche suggerite da AIFA.
            </p>
            <Link href="/farmaci" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
              Consulta la lista →
            </Link>
          </article>

          <article className="card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Cittadini</h3>
            <p className="mt-2 text-sm text-slate-600">
              Cercate il farmaco che vi serve: se una farmacia vicina ha ancora
              scorte, trovate indirizzo e contatti per andare sul sicuro.
            </p>
            <Link href="/farmaci" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
              Trova il farmaco →
            </Link>
          </article>

          <article className="card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Farmacie</h3>
            <p className="mt-2 text-sm text-slate-600">
              Segnalate le disponibilità temporanee di farmaci carenti: la
              segnalazione ha una scadenza e si aggiorna in tempo reale per i
              cittadini.
            </p>
            <Link href="/area-farmacie" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
              Area farmacie →
            </Link>
          </article>
        </div>
      </section>

      {/* Come funziona */}
      <section className="border-t border-slate-200 bg-white">
        <div className="container-app py-14">
          <h2 className="text-center text-2xl font-bold">Come funziona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "AIFA pubblica la lista",
                d: "Il portale importa periodicamente l'elenco ufficiale dei farmaci temporaneamente carenti, con motivazioni e indicazioni.",
              },
              {
                t: "La farmacia segnala le scorte",
                d: "Quando riceve confezioni di un farmaco carente, la farmacia indica quantità e data fino a cui la segnalazione è valida.",
              },
              {
                t: "Il cittadino va a colpo sicuro",
                d: "Sulla scheda del farmaco compaiono le farmacie con disponibilità attiva, con indirizzo, contatti e mappa.",
              },
            ].map((step, i) => (
              <li key={step.t} className="card p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
