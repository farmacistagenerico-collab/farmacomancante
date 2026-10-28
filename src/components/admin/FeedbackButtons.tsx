"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FeedbackModerationButtons({
  feedbackId,
  hidden,
}: {
  feedbackId: number;
  hidden: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(nextHidden: boolean) {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/admin/pareri/${feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: nextHidden }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Operazione non riuscita");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Eliminare definitivamente questo parere?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/pareri/${feedbackId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Eliminazione non riuscita");
      return;
    }
    router.refresh();
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => patch(!hidden)}
        disabled={busy}
        className="btn-secondary px-3 py-1.5 text-xs"
      >
        {busy ? "…" : hidden ? "Ripristina" : "Nascondi"}
      </button>
      <button onClick={remove} disabled={busy} className="btn-danger px-3 py-1.5 text-xs">
        {busy ? "…" : "Elimina"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
