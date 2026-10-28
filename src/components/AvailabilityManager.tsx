"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STOCK_LEVELS, STOCK_LEVEL_ORDER, formatDateIT, isoPlusDays, todayISO } from "@/lib/format";
import type { AvailabilityView, StockLevel } from "@/lib/types";

interface DrugSuggestion {
  aic: string;
  name: string;
  activeIngredient: string | null;
  formDosage: string | null;
}

type FieldErrors = Record<string, string>;

export function AvailabilityManager({ items }: { items: AvailabilityView[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([]);
  const [selected, setSelected] = useState<DrugSuggestion | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/farmaci/cerca?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { items: DrugSuggestion[] };
        setSuggestions(data.items);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function pick(s: DrugSuggestion) {
    setSelected(s);
    setQuery(s.name);
    setSuggestions([]);
    setFieldErrors((prev) => ({ ...prev, aic: "" }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});
    if (!selected) {
      setFieldErrors({ aic: "Seleziona un farmaco dalla lista" });
      return;
    }
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    const res = await fetch("/api/disponibilita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aic: selected.aic,
        stockLevel: form.get("stockLevel"),
        quantityLabel: form.get("quantityLabel"),
        note: form.get("note"),
        expiresAt: form.get("expiresAt"),
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setMessage({ ok: false, text: json.message ?? "Salvataggio non riuscito" });
      if (json.fields) setFieldErrors(json.fields);
      return;
    }
    setMessage({ ok: true, text: "Disponibilità salvata: è già visibile sulla scheda pubblica." });
    setSelected(null);
    setQuery("");
    e.currentTarget.reset();
    router.refresh();
  }

  async function remove(id: number) {
    if (!window.confirm("Eliminare questa segnalazione di disponibilità?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/disponibilita?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setMessage({ ok: true, text: "Segnalazione eliminata." });
      router.refresh();
    } else {
      setMessage({ ok: false, text: "Eliminazione non riuscita" });
    }
  }

  const today = todayISO();
  const err = (name: string) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-xs text-red-600" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
      {/* Form nuova segnalazione */}
      <section className="card h-fit p-6">
        <h2 className="text-lg font-semibold">Nuova segnalazione</h2>
        {message && (
          <p
            role="status"
            className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${
              message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="relative">
            <label htmlFor="drug-search" className="label">
              Farmaco carente *
            </label>
            <input
              id="drug-search"
              type="text"
              autoComplete="off"
              className="input"
              placeholder="Cerca per nome o principio attivo…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
            />
            {searching && <p className="mt-1 text-xs text-slate-400">Ricerca…</p>}
            {suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.aic}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(s);
                      }}
                      className="block w-full px-3.5 py-2.5 text-left hover:bg-brand-50"
                    >
                      <span className="block text-sm font-semibold text-slate-900">{s.name}</span>
                      <span className="block text-xs text-slate-500">
                        AIC {s.aic}
                        {s.activeIngredient ? ` · ${s.activeIngredient}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selected && (
              <p className="mt-1.5 text-xs text-emerald-700">
                Selezionato: {selected.name} (AIC {selected.aic})
              </p>
            )}
            {err("aic")}
          </div>

          <div>
            <label htmlFor="stockLevel" className="label">
              Livello di disponibilità *
            </label>
            <select id="stockLevel" name="stockLevel" className="input" defaultValue="disponibile">
              {STOCK_LEVEL_ORDER.map((level: StockLevel) => (
                <option key={level} value={level}>
                  {STOCK_LEVELS[level].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantityLabel" className="label">
              Quantità indicativa
            </label>
            <input
              id="quantityLabel"
              name="quantityLabel"
              type="text"
              className="input"
              placeholder="Es. 3 confezioni"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="note" className="label">
              Nota per il pubblico
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              className="input"
              placeholder="Es. disponibile solo su ordinazione"
              maxLength={300}
            />
          </div>

          <div>
            <label htmlFor="expiresAt" className="label">
              Segnalazione valida fino al *
            </label>
            <input
              id="expiresAt"
              name="expiresAt"
              type="date"
              className="input"
              min={today}
              defaultValue={isoPlusDays(7)}
              required
            />
            {err("expiresAt")}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Salvataggio…" : "Salva disponibilità"}
          </button>
        </form>
      </section>

      {/* Elenco segnalazioni */}
      <section>
        <h2 className="text-lg font-semibold">Le mie segnalazioni</h2>
        {items.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-sm text-slate-500">
            Non hai ancora segnalato disponibilità. Usa il modulo a sinistra per aggiungere
            la prima.
          </div>
        ) : (
          <div className="table-wrap mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Farmaco</th>
                  <th>Livello</th>
                  <th>Valida fino al</th>
                  <th>Stato</th>
                  <th aria-label="Azioni" />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const active = a.expiresAt >= today;
                  return (
                    <tr key={a.id}>
                      <td>
                        <a
                          href={`/farmaci/${a.aic}`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          {a.drugName}
                        </a>
                        <span className="block text-xs text-slate-500">AIC {a.aic}</span>
                      </td>
                      <td>{STOCK_LEVELS[a.stockLevel].label}</td>
                      <td className="whitespace-nowrap">{formatDateIT(a.expiresAt)}</td>
                      <td>
                        {active ? (
                          <span className="badge-green">Attiva</span>
                        ) : (
                          <span className="badge-gray">Scaduta</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => remove(a.id)}
                          disabled={deletingId === a.id}
                          className="btn-danger px-3 py-1.5 text-xs"
                        >
                          {deletingId === a.id ? "…" : "Elimina"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
