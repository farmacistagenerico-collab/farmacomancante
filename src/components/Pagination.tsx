import Link from "next/link";

export function Pagination({
  page,
  total,
  pageSize,
  baseParams,
}: {
  page: number;
  total: number;
  pageSize: number;
  baseParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(baseParams)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `/farmaci?${params.toString()}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Paginazione"
    >
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="btn-secondary px-3 py-1.5 text-xs">
          ← Precedente
        </Link>
      )}
      {start > 1 && (
        <>
          <Link href={makeHref(1)} className="btn-secondary px-3 py-1.5 text-xs">
            1
          </Link>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "inline-flex min-w-9 items-center justify-center rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white"
              : "btn-secondary px-3 py-1.5 text-xs"
          }
        >
          {p}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <Link href={makeHref(totalPages)} className="btn-secondary px-3 py-1.5 text-xs">
            {totalPages}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className="btn-secondary px-3 py-1.5 text-xs">
          Successiva →
        </Link>
      )}
    </nav>
  );
}
