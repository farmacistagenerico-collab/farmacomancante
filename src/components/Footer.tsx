import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-app py-10 text-sm text-slate-500">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-2 text-base font-bold text-slate-900">
              Farmaco<span className="text-brand-700">Mancante</span>
            </p>
            <p>
              Portale informativo sui farmaci temporaneamente carenti in Italia e
              sulla loro disponibilità residua sul territorio.
            </p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-slate-700">Il progetto</p>
            <ul className="space-y-1">
              <li>
                <Link href="/come-funziona" className="hover:text-brand-700 hover:underline">
                  Come funziona
                </Link>
              </li>
              <li>
                <Link href="/parere" className="hover:text-brand-700 hover:underline">
                  Dai la tua opinione
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-700 hover:underline">
                  Privacy e dati
                </Link>
              </li>
              <li>
                <a href={`mailto:${site.contactEmail}`} className="hover:text-brand-700 hover:underline">
                  {site.contactEmail}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-slate-700">Fonti</p>
            <p>
              La lista dei farmaci carenti è pubblicata da AIFA e viene aggiornata
              periodicamente. Le disponibilità sono segnalate volontariamente dalle
              farmacie e hanno carattere temporaneo.
            </p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-slate-700">Avvertenze</p>
            <p>
              Le informazioni non sostituiscono il parere del medico o del farmacista.
              Verifica sempre la disponibilità contattando la farmacia prima di
              recarti sul posto.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FarmacoMancante — progetto informativo indipendente.</p>
          <p>
            Dati AIFA aggiornati automaticamente · segnalazioni della comunità con scadenza
            automatica.
          </p>
        </div>
      </div>
    </footer>
  );
}
