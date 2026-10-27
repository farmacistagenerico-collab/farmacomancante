import type { Metadata } from "next";
import { ensureData, listCommunityReports } from "@/lib/db";
import { getCurrentPharmacy } from "@/lib/auth";
import { ReportsList } from "@/components/ReportsList";
import { SignalForm } from "@/components/SignalForm";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Segnalazioni di mancanza",
  description:
    "Segnalazioni comunitarie di farmaci mancanti o in corso di risoluzione, anche non ancora presenti nella lista ufficiale AIFA.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function SegnalazioniPage({ searchParams }: PageProps) {
  await ensureData();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Number.isInteger(Number(sp.page)) ? Math.max(1, Number(sp.page)) : 1;

  const { items, total } = listCommunityReports({ q, page, pageSize: PAGE_SIZE });
  const pharmacy = await getCurrentPharmacy();

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Segnalazioni di mancanza</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        La rete delle farmacie, dei medici e dei cittadini segnala in tempo reale i farmaci
        che non si trovano e quelli in corso di rientro. Le segnalazioni durano 14 giorni e
        concorrono al semaforo visibile sulle schede dei farmaci.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="h-fit">
          <h2 className="mb-3 text-lg font-semibold">Segnala un farmaco</h2>
          <p className="mb-4 text-xs text-slate-500">
            Usa questo modulo anche per farmaci che non compaiono ancora nella lista AIFA.
          </p>
          <SignalForm
            mode="free"
            pharmacy={pharmacy ? { id: pharmacy.id, name: pharmacy.name, city: pharmacy.city } : null}
          />
        </div>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Segnalazioni attive{" "}
              <span className="text-sm font-normal text-slate-500">
                ({total.toLocaleString("it-IT")})
              </span>
            </h2>
          </div>

          <form method="GET" action="/segnalazioni" className="mt-3 flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Filtra per farmaco o principio attivo…"
              className="input"
              aria-label="Filtra segnalazioni"
            />
            <button type="submit" className="btn-primary shrink-0">
              Filtra
            </button>
          </form>

          <div className="mt-4">
            <ReportsList
              reports={items}
              emptyText="Nessuna segnalazione attiva: puoi inviare la prima usando il modulo."
            />
          </div>
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} baseParams={{ q }} />
        </section>
      </div>
    </div>
  );
}
