"use client";

import { useState } from "react";

const ROLES = [
  { value: "medico", label: "Medico prescrittore", hint: "MMG, specialista, pediatra" },
  { value: "farmacista", label: "Farmacista", hint: "Titolare, collaboratore, ospedaliero" },
  { value: "cittadino", label: "Cittadino", hint: "Paziente o familiare" },
  { value: "altro", label: "Altro", hint: "Associazione, giornalista, ricercatore…" },
];

const FEATURES = [
  "Ricerca farmaco",
  "Lista AIFA",
  "Semaforo delle carenze",
  "Disponibilità delle farmacie",
  "Mappa",
  "Segnalazioni della comunità",
  "Segnalazione di una mancanza",
];

const RATING_QUESTIONS = [
  { key: "ratingUseful", label: "Quanto ti è stato utile?", low: "Per niente", high: "Moltissimo" },
  { key: "ratingClarity", label: "Quanto è chiaro cosa mostra la scheda farmaco?", low: "Confuso", high: "Chiarissimo" },
  { key: "ratingTrust", label: "Quanto ti fidi dei dati che vedi?", low: "Per niente", high: "Pienamente" },
] as const;

type RatingKey = (typeof RATING_QUESTIONS)[number]["key"];

function Stars({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={name}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} su 5`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
              active ? "text-amber-500" : "text-slate-300"
            } hover:bg-amber-50`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden="true">
              <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-xs text-slate-500">{value > 0 ? `${value}/5` : "tocca le stelle"}</span>
    </div>
  );
}

export function FeedbackForm() {
  const [role, setRole] = useState("");
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    ratingUseful: 0,
    ratingClarity: 0,
    ratingTrust: 0,
  });
  const [recommend, setRecommend] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [missing, setMissing] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  function toggleFeature(feature: string) {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!role) next.role = "Indica il tuo ruolo";
    if (!ratings.ratingUseful) next.ratingUseful = "Dai un voto all'utilità";
    if (!ratings.ratingClarity) next.ratingClarity = "Dai un voto alla chiarezza";
    if (!ratings.ratingTrust) next.ratingTrust = "Dai un voto alla fiducia";
    if (!recommend) next.recommend = "Indica se lo consiglieresti";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Email non valida";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setState("sending");
    try {
      const res = await fetch("/api/pareri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          ...ratings,
          recommend,
          usedFeatures: features,
          name,
          email,
          city,
          missing,
          comment,
          website,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          message?: string;
          fields?: Record<string, string>;
        };
        setErrors(json.fields ?? {});
        setServerError(json.message ?? "Invio non riuscito, riprova.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setServerError("Connessione non disponibile: riprova tra poco.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-emerald-900">Grazie del parere</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-800">
          Il questionario è registrato. Se hai lasciato un&apos;email potremmo ricontattarti
          per capire meglio come migliorare il portale.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-8 p-6 sm:p-8" noValidate>
      {/* Honeypot invisibile agli umani */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Non compilare</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="text-base font-semibold text-slate-900">
          Chi sei? <span className="text-red-600">*</span>
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                role === r.value
                  ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="mt-1 accent-brand-700"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                <span className="block text-xs text-slate-500">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.role && <p className="mt-2 text-xs text-red-600">{errors.role}</p>}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-900">
          Valuta il portale <span className="text-red-600">*</span>
        </legend>
        {RATING_QUESTIONS.map((q) => (
          <div key={q.key} className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-800">{q.label}</p>
            <div className="mt-2">
              <Stars
                name={q.label}
                value={ratings[q.key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [q.key]: v }))}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] uppercase tracking-wide text-slate-400">
              <span>{q.low}</span>
              <span>{q.high}</span>
            </div>
            {errors[q.key] && <p className="mt-1 text-xs text-red-600">{errors[q.key]}</p>}
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-slate-900">
          Lo consiglieresti a un collega? <span className="text-red-600">*</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { value: "si", label: "Sì, senza dubbi" },
            { value: "forse", label: "Forse, con riserve" },
            { value: "no", label: "No" },
          ].map((o) => (
            <label
              key={o.value}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${
                recommend === o.value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name="recommend"
                value={o.value}
                checked={recommend === o.value}
                onChange={() => setRecommend(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
        {errors.recommend && <p className="mt-2 text-xs text-red-600">{errors.recommend}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-base font-semibold text-slate-900">
          Cosa hai usato? <span className="font-normal text-slate-500">(facoltativo)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <label
              key={f}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                features.includes(f)
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={features.includes(f)}
                onChange={() => toggleFeature(f)}
                className="sr-only"
              />
              {features.includes(f) ? "✓ " : ""}
              {f}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-base font-semibold text-slate-900">
          Qualche dettaglio <span className="font-normal text-slate-500">(facoltativo)</span>
        </legend>
        <div>
          <label htmlFor="name" className="label">
            Nome o studio
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Dott.ssa Bianchi"
          />
        </div>
        <div>
          <label htmlFor="city" className="label">
            Città
          </label>
          <input
            id="city"
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
            placeholder="Brescia"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className="label">
            Email <span className="text-slate-400">(solo se vuoi essere ricontattato)</span>
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            placeholder="nome@esempio.it"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="missing" className="label">
            Cosa manca secondo te?
          </label>
          <textarea
            id="missing"
            className="input min-h-[70px]"
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            maxLength={500}
            placeholder="Es. filtro per regione, avvisi via email, versione per pazienti…"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="comment" className="label">
            Commento libero
          </label>
          <textarea
            id="comment"
            className="input min-h-[90px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder="Cosa funziona, cosa confonde, cosa ti servirebbe davvero in uno studio o in farmacia."
          />
        </div>
      </fieldset>

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
        <button type="submit" className="btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Invio in corso…" : "Invia il parere"}
        </button>
        <p className="text-xs text-slate-500">
          Due minuti. Nessun dato sanitario, nessun tracciamento.
        </p>
      </div>
    </form>
  );
}
