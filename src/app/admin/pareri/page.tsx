import type { Metadata } from "next";
import { getFeedbackSummary, listFeedback } from "@/lib/db";
import { formatDateTimeIT } from "@/lib/format";
import { FeedbackModerationButtons } from "@/components/admin/FeedbackButtons";
import { requireAdminPage } from "@/lib/admin-guard";

export const metadata: Metadata = { title: "Pareri" };
export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  medico: "Medico",
  farmacista: "Farmacista",
  cittadino: "Cittadino",
  altro: "Altro",
};

const RECOMMEND_LABELS: Record<string, string> = {
  si: "Consiglierebbe",
  forse: "Con riserve",
  no: "Non consiglierebbe",
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} su 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 ${n <= value ? "text-amber-500" : "text-slate-200"}`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default async function AdminFeedbackPage() {
  await requireAdminPage();
  const summary = getFeedbackSummary();
  const items = listFeedback({ includeHidden: true, limit: 200 });

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pareri raccolti</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le risposte al questionario pubblico. Non vengono mai pubblicate con il nome
            dell&apos;autore.
          </p>
        </div>
        <a href="/api/admin/pareri/export" className="btn-secondary text-xs">
          Scarica CSV
        </a>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="card p-4">
          <p className="text-2xl font-bold text-brand-700">{summary.total}</p>
          <p className="mt-1 text-xs text-slate-500">pareri</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-brand-700">{summary.averageUseful}</p>
          <p className="mt-1 text-xs text-slate-500">utilità media</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-brand-700">{summary.averageClarity}</p>
          <p className="mt-1 text-xs text-slate-500">chiarezza media</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-brand-700">{summary.averageTrust}</p>
          <p className="mt-1 text-xs text-slate-500">fiducia media</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-emerald-600">{summary.recommendSi}</p>
          <p className="mt-1 text-xs text-slate-500">lo consiglierebbero</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-amber-600">
            {summary.recommendMaybe + summary.recommendNo}
          </p>
          <p className="mt-1 text-xs text-slate-500">con riserve o no</p>
        </div>
      </section>

      {summary.byRole.length > 0 && (
        <section className="card p-6">
          <h3 className="text-sm font-semibold text-slate-700">Composizione del campione</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {summary.byRole.map((r) => (
              <li key={r.role} className="badge-gray">
                {ROLE_LABELS[r.role] ?? r.role}: {r.count}
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 ? (
        <p className="card p-8 text-center text-sm text-slate-500">
          Nessun parere ancora. Condividi il link <code>/parere</code> con i colleghi.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((f) => (
            <li key={f.id} className={`card p-5 ${f.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                    {f.name || "Anonimo"}
                    <span className="badge-gray">{ROLE_LABELS[f.role] ?? f.role}</span>
                    <span
                      className={
                        f.recommend === "si"
                          ? "badge-green"
                          : f.recommend === "forse"
                            ? "badge-amber"
                            : "badge bg-red-100 text-red-800 ring-red-600/20"
                      }
                    >
                      {RECOMMEND_LABELS[f.recommend] ?? f.recommend}
                    </span>
                    {f.hidden === 1 && <span className="badge-gray">nascosto</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTimeIT(f.createdAt)}
                    {f.city ? ` · ${f.city}` : ""}
                    {f.email ? ` · ${f.email}` : ""}
                  </p>
                </div>
                <FeedbackModerationButtons feedbackId={f.id} hidden={f.hidden === 1} />
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  Utilità <Stars value={f.ratingUseful} />
                </span>
                <span className="flex items-center gap-1">
                  Chiarezza <Stars value={f.ratingClarity} />
                </span>
                <span className="flex items-center gap-1">
                  Fiducia <Stars value={f.ratingTrust} />
                </span>
              </div>

              {f.usedFeatures.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {f.usedFeatures.map((feature) => (
                    <span key={feature} className="badge-gray">
                      {feature}
                    </span>
                  ))}
                </p>
              )}

              {f.missing && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold">Manca: </span>
                  {f.missing}
                </p>
              )}
              {f.comment && (
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{f.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
