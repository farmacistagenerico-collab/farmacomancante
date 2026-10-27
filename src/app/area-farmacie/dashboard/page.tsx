import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPharmacy } from "@/lib/auth";
import { listMyAvailability } from "@/lib/db";
import { AvailabilityManager } from "@/components/AvailabilityManager";

export const metadata: Metadata = { title: "Dashboard farmacia" };

export default async function DashboardPage() {
  const pharmacy = await getCurrentPharmacy();
  if (!pharmacy) redirect("/area-farmacie/accedi");

  const items = listMyAvailability(pharmacy.id);

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
        <Link href="/farmaci" className="btn-secondary text-xs">
          Consulta la lista pubblica
        </Link>
      </div>

      <div className="mt-8">
        <AvailabilityManager items={items} />
      </div>
    </div>
  );
}
