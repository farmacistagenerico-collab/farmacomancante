import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPharmacy, isAdmin } from "@/lib/auth";

export const metadata = {
  title: "Amministrazione",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pharmacy = await getCurrentPharmacy();
  if (!isAdmin(pharmacy)) {
    redirect("/area-farmacie/accedi");
  }

  const tabs = [
    { href: "/admin", label: "Panoramica" },
    { href: "/admin/farmacie", label: "Farmacie" },
    { href: "/admin/segnalazioni", label: "Segnalazioni" },
    { href: "/admin/pareri", label: "Pareri" },
    { href: "/admin/fonti", label: "Fonti e aggiornamenti" },
  ];

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Amministrazione</h1>
          <p className="mt-1 text-sm text-slate-500">
            Accesso come {pharmacy!.name}
            {pharmacy!.role === "admin" ? "" : " (amministratore via variabile d'ambiente)"}
          </p>
        </div>
      </div>
      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Sezioni amministrative">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="btn-secondary text-xs">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
