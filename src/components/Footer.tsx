export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-app py-10 text-sm text-slate-500">
        <div className="grid gap-8 md:grid-cols-3">
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
        <p className="mt-8 border-t border-slate-100 pt-6 text-xs">
          © {new Date().getFullYear()} FarmacoMancante — progetto sperimentale open source.
        </p>
      </div>
    </footer>
  );
}
