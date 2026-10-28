import Link from "next/link";
import { getCurrentPharmacy, isAdmin } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/farmaci", label: "Lista farmaci carenti" },
  { href: "/segnalazioni", label: "Segnalazioni" },
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/area-farmacie", label: "Per le farmacie" },
];

export async function Header() {
  const pharmacy = await getCurrentPharmacy();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="FarmacoMancante, home">
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

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigazione principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/parere"
            className="ml-1 rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Dai la tua opinione
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
            <Link href="/area-farmacie/accedi" className="btn-primary hidden sm:inline-flex">
              Accedi
            </Link>
          )}

          {/* Menu mobile: <details> funziona anche senza JavaScript */}
          <details className="group relative lg:hidden">
            <summary className="btn-secondary list-none px-3 py-2 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Apri il menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/parere"
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Dai la tua opinione
              </Link>
              <div className="my-1 border-t border-slate-100" />
              {pharmacy ? (
                <>
                  {isAdmin(pharmacy) && (
                    <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      Admin
                    </Link>
                  )}
                  <Link href="/area-farmacie/dashboard" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Dashboard farmacia
                  </Link>
                </>
              ) : (
                <Link href="/area-farmacie/accedi" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Accedi come farmacia
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
