import { STATUS_META } from "@/lib/status";
import type { DrugStatus } from "@/lib/types";
import { SHORTAGE_SIGNAL_LABELS } from "@/lib/format";

export function StatusBadge({
  status,
  withDescription = false,
}: {
  status: DrugStatus;
  withDescription?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span>
      <span className={`badge ${meta.badgeClass}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} aria-hidden="true" />
        {meta.label}
      </span>
      {withDescription && (
        <span className="mt-1 block text-xs text-slate-500">{meta.description}</span>
      )}
    </span>
  );
}

export function SignalBadge({ signal }: { signal: "mancante" | "risoluzione" }) {
  if (signal === "mancante") {
    return (
      <span className="badge bg-red-100 text-red-800 ring-red-600/20">
        <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
        {SHORTAGE_SIGNAL_LABELS.mancante}
      </span>
    );
  }
  return (
    <span className="badge bg-amber-100 text-amber-800 ring-amber-600/20">
      <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
      {SHORTAGE_SIGNAL_LABELS.risoluzione}
    </span>
  );
}
