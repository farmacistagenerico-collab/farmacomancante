import Link from "next/link";
import { getCurrentPharmacy, isAdmin } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const pharmacy = await getCurrentPharmacy();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Farmaco<span className="text-brand-700">Mancante</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigazione principale">
          <Link
            href="/farmaci"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Lista farmaci carenti
          </Link>
          <Link
            href="/segnalazioni"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Segnalazioni
          </Link>
          <Link
            href="/area-farmacie"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Per le farmacie
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {pharmacy ? (
            <>
              {isAdmin(pharmacy) && (
                <Link href="/admin" className="btn-secondary hidden sm:inline-flex">
                  Admin
                </Link>
              )}
              <Link href="/area-farmacie/dashboard" className="btn-secondary hidden sm:inline-flex">
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/area-farmacie/accedi" className="btn-primary">
              Accedi
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
