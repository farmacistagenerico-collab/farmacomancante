import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-app py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">404</p>
      <h1 className="mt-2 text-3xl font-bold">Pagina non trovata</h1>
      <p className="mt-3 text-slate-600">
        La pagina o la scheda farmaco che cerchi non esiste o è stata rimossa.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Torna alla home
        </Link>
        <Link href="/farmaci" className="btn-secondary">
          Lista farmaci
        </Link>
      </div>
    </div>
  );
}
