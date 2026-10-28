"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResolveReportButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve() {
    if (!window.confirm("Marcare questa segnalazione come risolta?")) return;
    setLoading(true);
    const res = await fetch(`/api/segnalazioni/${id}`, { method: "PATCH" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button onClick={resolve} disabled={loading} className="btn-secondary px-3 py-1.5 text-xs">
      {loading ? "…" : "Segna come risolta"}
    </button>
  );
}
