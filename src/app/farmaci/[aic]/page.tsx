import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureData, getActiveAvailability, getDrugByAic } from "@/lib/db";
import { formatDateIT, STOCK_LEVELS } from "@/lib/format";
import { EquivalentBadge, StockLevelBadge } from "@/components/Badges";
import { MapWrapper, type MapMarker } from "@/components/MapWrapper";

interface PageProps {
  params: Promise<{ aic: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { aic } = await params;
  const drug = getDrugByAic(aic);
  return { title: drug ? `${drug.name} (AIC ${drug.aic})` : "Farmaco non trovato" };
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value || "—"}</dd>
    </div>
  );
}

export default async function DrugDetailPage({ params }: PageProps) {
  await ensureData();
  const { aic } = await params;
  const drug = getDrugByAic(aic);
  if (!drug) notFound();

  const availabilities = getActiveAvailability(aic);
  const markers: MapMarker[] = availabilities
    .filter((a) => a.pharmacy.lat !== null && a.pharmacy.lng !== null)
    .map((a) => ({
      lat: a.pharmacy.lat as number,
      lng: a.pharmacy.lng as number,
      name: a.pharmacy.name,
      city: a.pharmacy.city,
      address: a.pharmacy.address,
    }));

  return (
    <div className="container-app py-10">
      <Link
        href="/farmaci"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← Torna alla lista
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{drug.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            AIC {drug.aic}
            {drug.atcCode ? ` · Codice ATC ${drug.atcCode}` : ""}
          </p>
        </div>
        <EquivalentBadge hasEquivalent={drug.hasEquivalent} />
      </div>

      {/* Scheda informativa AIFA */}
      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold">Dati della carenza</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Principio attivo" value={drug.activeIngredient} />
          <Field label="Titolare AIC" value={drug.aicHolder} />
          <Field label="Forma farmaceutica e dosaggio" value={drug.formDosage} />
          <Field label="Classe di rimborsabilità" value={drug.reimbursementClass} />
          <Field label="Data inizio carenza" value={formatDateIT(drug.startDate)} />
          <Field
            label="Fine presunta"
            value={drug.presumedEndDate ? formatDateIT(drug.presumedEndDate) : "Non comunicata"}
          />
          <Field label="Motivazione" value={drug.reasons} />
          <Field label="Equivalente (dato AIFA)" value={drug.equivalentRaw} />
        </dl>

        {drug.aifaSuggestions && (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
              Suggerimenti / indicazioni AIFA
            </p>
            <p className="mt-1.5 text-sm text-slate-800">{drug.aifaSuggestions}</p>
          </div>
        )}
        {drug.aifaNote && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nota AIFA
            </p>
            <p className="mt-1.5 text-sm text-slate-800">{drug.aifaNote}</p>
          </div>
        )}
      </section>

      {/* Disponibilità sul territorio */}
      <section id="disponibilita" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Dove trovarlo</h2>
          <Link href="/area-farmacie" className="btn-secondary text-xs">
            Sei una farmacia? Segnala disponibilità
          </Link>
        </div>

        {availabilities.length === 0 ? (
          <div className="card mt-4 p-8 text-center">
            <p className="font-semibold text-slate-800">
              Nessuna farmacia ha ancora segnalato disponibilità per questo farmaco
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Le segnalazioni sono temporanee e compaiono qui non appena una farmacia
              conferma di avere la confezione a magazzino.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {availabilities.length}{" "}
              {availabilities.length === 1 ? "farmacia segnala" : "farmacie segnalano"}{" "}
              disponibilità attiva. Contatta sempre la farmacia prima di recarti sul posto.
            </p>

            {markers.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <MapWrapper markers={markers} />
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {availabilities.map((a) => (
                <article key={a.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{a.pharmacy.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {[a.pharmacy.address, a.pharmacy.cap, a.pharmacy.city, a.pharmacy.province]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <StockLevelBadge level={a.stockLevel} />
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    {a.pharmacy.phone && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-slate-500">Telefono:</dt>
                        <dd>
                          <a
                            href={`tel:${a.pharmacy.phone.replace(/\s/g, "")}`}
                            className="text-brand-700 hover:underline"
                          >
                            {a.pharmacy.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {a.quantityLabel && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-slate-500">Quantità:</dt>
                        <dd>{a.quantityLabel}</dd>
                      </div>
                    )}
                    {a.note && (
                      <div className="flex gap-2">
                        <dt className="font-medium text-slate-500">Nota:</dt>
                        <dd>{a.note}</dd>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500">Segnalazione valida fino al:</dt>
                      <dd>{formatDateIT(a.expiresAt)}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-slate-400">
                    {STOCK_LEVELS[a.stockLevel].description}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
