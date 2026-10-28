"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[errore pagina]", error);
  }, [error]);

  return (
    <div className="container-app py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
        Errore temporaneo
      </p>
      <h1 className="mt-2 text-3xl font-bold">Qualcosa non ha funzionato</h1>
      <p className="mx-auto mt-3 max-w-xl text-slate-600">
        La pagina non è riuscita a caricarsi. I dati AIFA non sono andati persi:
        riprova tra qualche istante.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate-400">Codice errore: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Riprova
        </button>
        <Link href="/" className="btn-secondary">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
