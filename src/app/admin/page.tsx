import Link from "next/link";
import {
  getStats,
  listAllReports,
  listSources,
  listAllPharmacies,
} from "@/lib/db";
import { formatDateTimeIT } from "@/lib/format";
import { requireAdminPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdminPage();
  const stats = getStats();
  const sources = listSources();
  const recentReports = listAllReports({ show: "attivi", limit: 8 });
  const pharmacies = listAllPharmacies();
  const unverified = pharmacies.filter((p) => p.verified === 0).length;

  const cards = [
    { label: "Farmaci in lista AIFA", value: stats.drugCount },
    { label: "Farmacie iscritte", value: stats.pharmacyCount },
    { label: "Di cui non verificate", value: unverified },
    { label: "Segnalazioni attive", value: stats.activeReportCount },
    { label: "Disponibilità attive", value: stats.activeAvailabilityCount },
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-2xl font-bold text-brand-700">
              {c.value.toLocaleString("it-IT")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Stato delle fonti</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {sources.map((s) => (
            <li key={s.code} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.lastSyncAt
                    ? `ultimo aggiornamento ${formatDateTimeIT(s.lastSyncAt)} · stato: ${s.lastStatus ?? "n/d"}`
                    : "mai sincronizzata"}
                </p>
              </div>
              <span className={`badge ${s.lastSyncAt ? "badge-green" : "badge-gray"}`}>
                {s.kind}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/admin/fonti" className="btn-secondary mt-4 inline-flex text-xs">
          Gestisci fonti e aggiornamenti
        </Link>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ultime segnalazioni attive</h2>
          <Link href="/admin/segnalazioni" className="text-xs font-semibold text-brand-700 hover:underline">
            Vedi tutte →
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nessuna segnalazione attiva.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {recentReports.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <span className="font-semibold text-slate-800">{r.drugName}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {r.signal} · {r.city ?? "località n/d"} · {formatDateTimeIT(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
