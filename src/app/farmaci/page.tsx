import type { Metadata } from "next";
import Link from "next/link";
import { ensureData, getLatestBatch, searchDrugs } from "@/lib/db";
import { formatDateIT } from "@/lib/format";
import { AvailabilityCountBadge, EquivalentBadge } from "@/components/Badges";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = { title: "Lista farmaci carenti" };

interface PageProps {
  searchParams: Promise<{ q?: string; equivalent?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function FarmaciPage({ searchParams }: PageProps) {
  await ensureData();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const equivalent = sp.equivalent === "si" || sp.equivalent === "no" ? sp.equivalent : undefined;
  const page = Number.isInteger(Number(sp.page)) ? Math.max(1, Number(sp.page)) : 1;

  const { items, total } = searchDrugs({ q, equivalent, page, pageSize: PAGE_SIZE });
  const batch = getLatestBatch();

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Farmaci temporaneamente carenti</h1>
        <p className="mt-2 text-sm text-slate-600">
          {total.toLocaleString("it-IT")} risultati
          {batch?.listDate && (
            <>
              {" "}
              · lista AIFA aggiornata al{" "}
              <span className="font-medium">{formatDateIT(batch.listDate)}</span>
            </>
          )}
        </p>
      </div>

      {/* Filtri */}
      <form method="GET" action="/farmaci" className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div>
            <label htmlFor="q" className="sr-only">
              Cerca
            </label>
            <input
              id="q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nome, principio attivo o codice AIC…"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="equivalent" className="sr-only">
              Equivalente
            </label>
            <select id="equivalent" name="equivalent" defaultValue={equivalent ?? ""} className="input md:w-56">
              <option value="">Tutti i farmaci</option>
              <option value="si">Con equivalente disponibile</option>
              <option value="no">Senza equivalente</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Filtra
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">Nessun farmaco trovato</p>
          <p className="mt-2 text-sm text-slate-500">
            Prova con un altro termine o cancella i filtri.
          </p>
          <Link href="/farmaci" className="btn-secondary mt-5 inline-flex">
            Azzera filtri
          </Link>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Farmaco</th>
                  <th scope="col">Principio attivo</th>
                  <th scope="col">Equivalente</th>
                  <th scope="col">Inizio carenza</th>
                  <th scope="col">Disponibilità sul territorio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((drug) => (
                  <tr key={drug.aic}>
                    <td className="max-w-xs">
                      <Link
                        href={`/farmaci/${drug.aic}`}
                        className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                      >
                        {drug.name}
                      </Link>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        AIC {drug.aic}
                        {drug.atcCode ? ` · ATC ${drug.atcCode}` : ""}
                      </span>
                    </td>
                    <td className="max-w-[16rem] text-slate-600">
                      {drug.activeIngredient ?? "—"}
                    </td>
                    <td>
                      <EquivalentBadge hasEquivalent={drug.hasEquivalent} />
                    </td>
                    <td className="whitespace-nowrap text-slate-600">
                      {formatDateIT(drug.startDate)}
                    </td>
                    <td>
                      <Link href={`/farmaci/${drug.aic}#disponibilita`}>
                        <AvailabilityCountBadge count={drug.activeCount} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            baseParams={{ q, equivalent }}
          />
        </>
      )}
    </div>
  );
}
