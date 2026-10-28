import Link from "next/link";
import {
  REPORTER_ROLE_LABELS,
  REPORT_CHANNEL_LABELS,
  formatDateIT,
} from "@/lib/format";
import type { ShortageReportView } from "@/lib/types";
import { SignalBadge } from "./StatusBadge";
import { ResolveReportButton } from "./ResolveReportButton";

export function ReportsList({
  reports,
  canResolve = false,
  emptyText = "Nessuna segnalazione attiva al momento.",
}: {
  reports: ShortageReportView[];
  canResolve?: boolean;
  emptyText?: string;
}) {
  if (reports.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">{emptyText}</div>
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SignalBadge signal={r.signal} />
                <span className="badge-gray">{REPORT_CHANNEL_LABELS[r.channel]}</span>
                <span className="badge-gray">{REPORTER_ROLE_LABELS[r.reporterRole]}</span>
                {r.hidden === 1 && <span className="badge bg-slate-700 text-white">nascosta dalla moderazione</span>}
              </div>
              <p className="mt-2 font-semibold text-slate-900">
                {r.aic ? (
                  <Link
                    href={`/farmaci/${r.aic}`}
                    className="text-brand-700 hover:underline"
                  >
                    {r.drugName}
                  </Link>
                ) : (
                  r.drugName
                )}
                {r.activeIngredient && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    · {r.activeIngredient}
                  </span>
                )}
              </p>
            </div>
            {canResolve && r.status === "attivo" && <ResolveReportButton id={r.id} />}
          </div>

          {r.note && <p className="mt-2 text-sm text-slate-600">{r.note}</p>}

          <p className="mt-2 text-xs text-slate-500">
            {r.pharmacyName ? `${r.pharmacyName} — ` : r.reporterName ? `${r.reporterName} — ` : ""}
            {[r.city, r.province].filter(Boolean).join(", ") || "località non specificata"}
            {" · "}
            {formatDateIT(r.createdAt.slice(0, 10))}
            {" · valida fino al "}
            {formatDateIT(r.expiresAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
