export function SearchForm({
  initialQuery = "",
  large = false,
}: {
  initialQuery?: string;
  large?: boolean;
}) {
  return (
    <form action="/farmaci" method="GET" className="w-full" role="search">
      <div className={`flex w-full gap-2 ${large ? "flex-col sm:flex-row" : ""}`}>
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 3.392 9.823l3.142 3.143a.75.75 0 1 0 1.061-1.06l-3.143-3.143A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={initialQuery}
            placeholder="Cerca per nome farmaco, principio attivo o codice AIC…"
            aria-label="Cerca farmaco carente"
            className={`input pl-11 ${large ? "py-3.5 text-base" : ""}`}
          />
        </div>
        <button type="submit" className={large ? "btn-primary px-8 py-3.5 text-base" : "btn-primary"}>
          Cerca
        </button>
      </div>
    </form>
  );
}
