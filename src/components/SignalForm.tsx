"use client";

import { useState } from "react";
import { REPORT_TTL_DAYS } from "@/lib/format";
import type { Pharmacy, ReportChannel, ReporterRole, ShortageSignal } from "@/lib/types";

type FieldErrors = Record<string, string>;

export function SignalForm({
  mode,
  aic,
  drugName,
  pharmacy,
}: {
  mode: "drug" | "free";
  aic?: string;
  drugName?: string;
  pharmacy: Pick<Pharmacy, "id" | "name" | "city"> | null;
}) {
  const [signal, setSignal] = useState<ShortageSignal>("mancante");
  const [channel, setChannel] = useState<ReportChannel>("farmacia");
  const [role, setRole] = useState<ReporterRole>("cittadino");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      aic: aic ?? null,
      drugName: mode === "drug" ? drugName : (form.get("drugName") as string),
      activeIngredient: (form.get("activeIngredient") as string) || null,
      city: (form.get("city") as string) || null,
      province: (form.get("province") as string) || null,
      reporterRole: pharmacy ? "farmacia" : role,
      reporterName: (form.get("reporterName") as string) || null,
      channel,
      signal,
      note: (form.get("note") as string) || null,
      website: (form.get("website") as string) || "",
    };
    const res = await fetch("/api/segnalazioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.message ?? "Invio non riuscito");
      if (json.fields) setFieldErrors(json.fields);
      return;
    }
    setDone(true);
    e.currentTarget.reset();
  }

  const err = (name: string) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-xs text-red-600" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-emerald-700">Segnalazione ricevuta ✓</p>
        <p className="mt-2 text-sm text-slate-600">
          Grazie: la segnalazione contribuisce al semaforo del farmaco e resta attiva per{" "}
          {REPORT_TTL_DAYS} giorni, poi si spegne automaticamente se non rinnovata.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setSignal("mancante");
          }}
          className="btn-secondary mt-5"
        >
          Invia un'altra segnalazione
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      {/* Honeypot anti-bot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px]"
        aria-hidden="true"
      />

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Scelta del segnale: il "semaforo" */}
      <fieldset>
        <legend className="label">Cosa stai riscontrando? *</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSignal("mancante")}
            aria-pressed={signal === "mancante"}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              signal === "mancante"
                ? "border-red-500 bg-red-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold text-red-800">
              <span className="h-3 w-3 rounded-full bg-red-500" aria-hidden="true" />
              Mancante
            </span>
            <span className="mt-1 block text-xs text-slate-600">
              Il farmaco non è reperibile né in farmacia né dal grossista
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSignal("risoluzione")}
            aria-pressed={signal === "risoluzione"}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              signal === "risoluzione"
                ? "border-amber-500 bg-amber-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold text-amber-800">
              <span className="h-3 w-3 rounded-full bg-amber-500" aria-hidden="true" />
              In corso di risoluzione
            </span>
            <span className="mt-1 block text-xs text-slate-600">
              Riordino in arrivo o disponibilità parziale in rientro
            </span>
          </button>
        </div>
      </fieldset>

      {mode === "free" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="drugName" className="label">
              Nome del farmaco *
            </label>
            <input id="drugName" name="drugName" type="text" required className="input" />
            {err("drugName")}
          </div>
          <div>
            <label htmlFor="activeIngredient" className="label">
              Principio attivo
            </label>
            <input id="activeIngredient" name="activeIngredient" type="text" className="input" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="channel" className="label">
            Dove manca *
          </label>
          <select
            id="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as ReportChannel)}
            className="input"
          >
            <option value="farmacia">In farmacia</option>
            <option value="grossista">Dal grossista</option>
          </select>
        </div>
        <div>
          <label htmlFor="city" className="label">
            Città *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            defaultValue={pharmacy?.city ?? ""}
            className="input"
          />
          {err("city")}
        </div>
        <div>
          <label htmlFor="province" className="label">
            Prov.
          </label>
          <input
            id="province"
            name="province"
            type="text"
            maxLength={2}
            className="input uppercase"
            placeholder="BS"
          />
          {err("province")}
        </div>
      </div>

      {!pharmacy && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reporterRole" className="label">
              Sei *
            </label>
            <select
              id="reporterRole"
              value={role}
              onChange={(e) => setRole(e.target.value as ReporterRole)}
              className="input"
            >
              <option value="cittadino">Cittadino</option>
              <option value="medico">Medico</option>
              <option value="farmacia">Operatore di farmacia</option>
            </select>
          </div>
          <div>
            <label htmlFor="reporterName" className="label">
              Nome o struttura (facoltativo)
            </label>
            <input id="reporterName" name="reporterName" type="text" className="input" />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="note" className="label">
          Nota
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={300}
          className="input"
          placeholder="Es. atteso riordino per la prossima settimana"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Invio…" : "Invia segnalazione"}
      </button>
      <p className="text-center text-xs text-slate-400">
        La segnalazione è valida {REPORT_TTL_DAYS} giorni e contribuisce al calcolo del semaforo.
      </p>
    </form>
  );
}
