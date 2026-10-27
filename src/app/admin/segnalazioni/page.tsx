import Link from "next/link";
import { listAllReports } from "@/lib/db";
import {
  formatDateIT,
  REPORTER_ROLE_LABELS,
  REPORT_CHANNEL_LABELS,
} from "@/lib/format";
import { SignalBadge } from "@/components/StatusBadge";
import { ReportModerationButtons } from "@/components/admin/AdminButtons";

export const metadata = { title: "Segnalazioni · Admin" };

const FILTERS: { value: "attivi" | "risolti" | "nascosti"; label: string }[] = [
  { value: "attivi", label: "Attive" },
  { value: "risolti", label: "Risolte" },
  { value: "nascosti", label: "Nascoste" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const show = (["attivi", "risolti", "nascosti"] as const).find((v) => v === sp.vista) ?? "attivi";
  const q = sp.q?.trim() ?? "";
  const reports = listAllReports({ show, q });

  return (
    <div>
      <h2 className="text-lg font-semibold">Moderazione segnalazioni</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={`/admin/segnalazioni?vista=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={
              show === f.value ? "btn-primary px-3 py-1.5 text-xs" : "btn-secondary px-3 py-1.5 text-xs"
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form method="GET" action="/admin/segnalazioni" className="mt-4 flex gap-2">
        <input type="hidden" name="vista" value={show} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cerca per farmaco o principio attivo…"
          className="input"
          aria-label="Cerca segnalazioni"
        />
        <button type="submit" className="btn-primary shrink-0">
          Filtra
        </button>
      </form>

      {reports.length === 0 ? (
        <div className="card mt-5 p-8 text-center text-sm text-slate-500">
          Nessuna segnalazione in questa vista.
        </div>
      ) : (
        <div className="table-wrap mt-5">
          <table className="table">
            <thead>
              <tr>
                <th>Segnale</th>
                <th>Farmaco</th>
                <th>Segnalatore</th>
                <th>Località</th>
                <th>Scadenza</th>
                <th>Stato</th>
                <th aria-label="Azioni" />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className={r.hidden ? "opacity-60" : ""}>
                  <td>
                    <SignalBadge signal={r.signal} />
                  </td>
                  <td>
                    {r.aic ? (
                      <Link href={`/farmaci/${r.aic}`} className="font-semibold text-brand-700 hover:underline">
                        {r.drugName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-800">{r.drugName}</span>
                    )}
                    {r.note && <span className="mt-1 block text-xs text-slate-500">{r.note}</span>}
                  </td>
                  <td className="text-xs text-slate-600">
                    {REPORTER_ROLE_LABELS[r.reporterRole]}
                    {r.pharmacyName ? ` · ${r.pharmacyName}` : r.reporterName ? ` · ${r.reporterName}` : ""}
                  </td>
                  <td className="text-xs text-slate-600">
                    {[r.city, r.province].filter(Boolean).join(", ") || "—"}
                    <span className="block text-slate-400">{REPORT_CHANNEL_LABELS[r.channel]}</span>
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    {formatDateIT(r.expiresAt)}
                  </td>
                  <td>
                    {r.hidden ? (
                      <span className="badge-gray">nascosta</span>
                    ) : r.status === "risolto" ? (
                      <span className="badge-green">risolta</span>
                    ) : (
                      <span className="badge-amber">attiva</span>
                    )}
                  </td>
                  <td>
                    <ReportModerationButtons reportId={r.id} hidden={r.hidden === 1} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
