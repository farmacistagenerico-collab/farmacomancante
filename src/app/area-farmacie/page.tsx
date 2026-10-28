import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentPharmacy } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Area farmacie",
  robots: { index: false, follow: false },
};

export default async function AreaFarmaciePage() {
  const pharmacy = await getCurrentPharmacy();

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Area riservata alle farmacie</h1>
        <p className="mt-3 text-slate-600">
          Segnalate le disponibilità temporanee dei farmaci carenti: medici e cittadini
          troveranno la vostra farmacia direttamente sulla scheda del medicinale.
        </p>
      </div>

      {pharmacy ? (
        <div className="card mx-auto mt-10 max-w-xl p-8 text-center">
          <p className="text-lg font-semibold">Bentornata, {pharmacy.name}</p>
          <p className="mt-2 text-sm text-slate-600">
            Gestisci le segnalazioni di disponibilità dalla tua dashboard.
          </p>
          <Link href="/area-farmacie/dashboard" className="btn-primary mt-6 inline-flex">
            Vai alla dashboard
          </Link>
        </div>
      ) : (
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          <div className="card p-7">
            <h2 className="text-lg font-semibold">Accedi</h2>
            <p className="mt-2 text-sm text-slate-600">
              Hai già un account? Entra per gestire le tue segnalazioni.
            </p>
            <Link href="/area-farmacie/accedi" className="btn-primary mt-5 w-full">
              Accedi
            </Link>
          </div>
          <div className="card p-7">
            <h2 className="text-lg font-semibold">Registra la farmacia</h2>
            <p className="mt-2 text-sm text-slate-600">
              Crea un account gratuito e inizia a segnalare le disponibilità in pochi
              minuti.
            </p>
            <Link href="/area-farmacie/registrati" className="btn-secondary mt-5 w-full">
              Registrati
            </Link>
          </div>
        </div>
      )}

      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="text-xl font-bold">Come funziona la segnalazione</h2>
        <ol className="mt-5 space-y-4">
          {[
            "Cercate il farmaco carente per nome o codice AIC.",
            "Indicate il livello di disponibilità, un'eventuale quantità e una data di scadenza della segnalazione.",
            "La farmacia compare sulla scheda pubblica del farmaco fino alla data indicata, poi la segnalazione si spegne automaticamente.",
          ].map((text, i) => (
            <li key={i} className="card flex gap-4 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
