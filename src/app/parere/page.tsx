import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackForm } from "@/components/FeedbackForm";
import { getFeedbackSummary } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dai la tua opinione sul portale",
  description:
    "Questionario di due minuti per medici, farmacisti e cittadini: utilità, chiarezza e fiducia nei dati di FarmacoMancante.",
  alternates: { canonical: "/parere" },
};

export const dynamic = "force-dynamic";

export default function ParerePage() {
  const summary = getFeedbackSummary();

  return (
    <div className="container-app py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Il tuo parere
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Aiutaci a capire se serve davvero
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Il portale è nato per rispondere a una domanda concreta: «questo farmaco si trova
          oppure no?». Se lo usi in studio, in farmacia o come cittadino, due minuti del tuo
          tempo ci dicono cosa tenere e cosa cambiare.
        </p>

        {summary.total > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-brand-700">{summary.averageUseful}</p>
              <p className="mt-1 text-xs text-slate-500">utilità media</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-brand-700">{summary.averageClarity}</p>
              <p className="mt-1 text-xs text-slate-500">chiarezza media</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-brand-700">{summary.averageTrust}</p>
              <p className="mt-1 text-xs text-slate-500">fiducia media</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-brand-700">{summary.total}</p>
              <p className="mt-1 text-xs text-slate-500">pareri raccolti</p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <FeedbackForm />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
          <p>
            Vuoi capire da dove arrivano i dati prima di esprimerti?{" "}
            <Link href="/come-funziona" className="font-semibold text-brand-700 hover:underline">
              Leggi come funziona
            </Link>
            .
          </p>
          <p className="text-xs text-slate-500">
            I pareri sono visibili solo agli amministratori, mai pubblicati con il tuo nome.
          </p>
        </div>
      </div>
    </div>
  );
}
