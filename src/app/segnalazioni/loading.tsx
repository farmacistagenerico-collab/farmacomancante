export default function Loading() {
  return (
    <div className="container-app py-10" role="status" aria-live="polite">
      <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <span className="sr-only">Caricamento delle segnalazioni…</span>
    </div>
  );
}
