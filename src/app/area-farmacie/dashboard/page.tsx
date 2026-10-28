import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPharmacy } from "@/lib/auth";
import { listMyAvailability, listReportsByPharmacy } from "@/lib/db";
import { AvailabilityManager } from "@/components/AvailabilityManager";
import { ReportsList } from "@/components/ReportsList";

export const metadata: Metadata = {
  title: "Dashboard farmacia",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) redirect("/area-farmacie/accedi");

  const items = listMyAvailability(pharmacy.id);
  const reports = listReportsByPharmacy(pharmacy.id);

  return (
    <div className="container-app py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {[pharmacy.address, pharmacy.cap, pharmacy.city, pharmacy.province]
              .filter(Boolean)
              .join(", ") || "Dati sede non completi"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/segnalazioni" className="btn-secondary text-xs">
            Segnala un mancante
          </Link>
          <Link href="/farmaci" className="btn-secondary text-xs">
            Lista pubblica
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <AvailabilityManager items={items} />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Le mie segnalazioni di mancanza</h2>
        <p className="mt-1 text-sm text-slate-500">
          Stato dei farmaci che avete segnalato come mancanti o in corso di risoluzione.
        </p>
        <div className="mt-4">
          <ReportsList
            reports={reports}
            canResolve
            emptyText="Non avete ancora inviato segnalazioni di mancanza: usate il modulo sulla scheda di un farmaco o la pagina Segnalazioni."
          />
        </div>
      </section>
    </div>
  );
}
