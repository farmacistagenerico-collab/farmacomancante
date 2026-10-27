import { STOCK_LEVELS } from "@/lib/format";
import type { StockLevel } from "@/lib/types";

export function EquivalentBadge({ hasEquivalent }: { hasEquivalent: number | null }) {
  if (hasEquivalent === 1) {
    return <span className="badge-green">Equivalente disponibile</span>;
  }
  if (hasEquivalent === 0) {
    return <span className="badge-red">Nessun equivalente</span>;
  }
  return <span className="badge-gray">Equivalenza non dichiarata</span>;
}

export function AvailabilityCountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="badge-gray">Nessuna segnalazione</span>;
  }
  return (
    <span className="badge-green">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433a18.89 18.89 0 0 0 2.252-1.733C15.633 14.91 17 12.674 17 9.5A5.5 5.5 0 0 0 6 9.5c0 3.173 1.368 5.409 3.376 7.116a18.89 18.89 0 0 0 2.252 1.734 8.4 8.4 0 0 0 .757.432 6.9 6.9 0 0 0 .28.14l.019.009.006.002ZM13 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          clipRule="evenodd"
        />
      </svg>
      {count} {count === 1 ? "farmacia" : "farmacie"}
    </span>
  );
}

export function StockLevelBadge({ level }: { level: StockLevel }) {
  const info = STOCK_LEVELS[level];
  return <span className={`badge ${info.badgeClass}`}>{info.label}</span>;
}
