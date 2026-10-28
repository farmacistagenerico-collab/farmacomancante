"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function useAction() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | "import" | null>(null);
  return { router, loadingId, setLoadingId };
}

export function VerifyPharmacyButton({
  pharmacyId,
  verified,
}: {
  pharmacyId: number;
  verified: boolean;
}) {
  const { router, loadingId, setLoadingId } = useAction();
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    setLoadingId(pharmacyId);
    const res = await fetch(`/api/admin/farmacie/${pharmacyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !verified }),
    });
    setLoadingId(null);
    if (!res.ok) {
      setError("Operazione non riuscita");
      return;
    }
    router.refresh();
  }

  return (
    <span>
      <button
        onClick={toggle}
        disabled={loadingId === pharmacyId}
        className={verified ? "btn-secondary px-3 py-1.5 text-xs" : "btn-primary px-3 py-1.5 text-xs"}
      >
        {loadingId === pharmacyId ? "…" : verified ? "Revoca verifica" : "Verifica farmacia"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}

export function ReportModerationButtons({
  reportId,
  hidden,
  status,
}: {
  reportId: number;
  hidden: boolean;
  status: "attivo" | "risolto";
}) {
  const { router, loadingId, setLoadingId } = useAction();
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Record<string, boolean>) {
    setError(null);
    setLoadingId(reportId);
    const res = await fetch(`/api/admin/segnalazioni/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoadingId(null);
    if (!res.ok) {
      setError("Operazione non riuscita");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Eliminare definitivamente questa segnalazione?")) return;
    setLoadingId(reportId);
    const res = await fetch(`/api/admin/segnalazioni/${reportId}`, { method: "DELETE" });
    setLoadingId(null);
    if (!res.ok) {
      setError("Eliminazione non riuscita");
      return;
    }
    router.refresh();
  }

  const busy = loadingId === reportId;
  return (
    <span className="flex flex-wrap gap-2">
      {status === "attivo" && (
        <button onClick={() => patch({ resolve: true })} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">
          {busy ? "…" : "Segna risolta"}
        </button>
      )}
      <button
        onClick={() => patch({ hidden: !hidden })}
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

export function ImportAifaButton() {
  const { router, loadingId, setLoadingId } = useAction();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function runImport() {
    setMessage(null);
    setLoadingId("import");
    const res = await fetch("/api/admin/importa", { method: "POST" });
    const json = await res.json();
    setLoadingId(null);
    if (!res.ok) {
      setMessage({ ok: false, text: json.message ?? "Importazione non riuscita" });
      return;
    }
    setMessage({
      ok: true,
      text: `Lista aggiornata: ${json.summary.updated} righe, lista del ${json.summary.listDate ?? "n/d"}`,
    });
    router.refresh();
  }

  return (
    <div>
      <button onClick={runImport} disabled={loadingId === "import"} className="btn-primary">
        {loadingId === "import" ? "Importazione in corso…" : "Aggiorna lista AIFA ora"}
      </button>
      {message && (
        <p
          role="status"
          className={`mt-2 text-xs ${message.ok ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
