export default function Loading() {
  return (
    <div className="container-app py-10" role="status" aria-live="polite">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-96 animate-pulse rounded bg-slate-100" />
      <div className="mt-8 h-12 w-full animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <span className="sr-only">Caricamento della lista farmaci…</span>
    </div>
  );
}
