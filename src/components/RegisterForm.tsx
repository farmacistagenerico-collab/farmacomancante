"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldErrors = Record<string, string>;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function geocode(e: React.MouseEvent<HTMLButtonElement>, form: HTMLFormElement) {
    e.preventDefault();
    const data = new FormData(form);
    const address = [data.get("address"), data.get("cap"), data.get("city"), data.get("province")]
      .filter(Boolean)
      .join(", ");
    if (!address) {
      setGeoMessage("Inserisci almeno indirizzo e città per individuare le coordinate.");
      return;
    }
    setGeoLoading(true);
    setGeoMessage("Ricerca coordinate in corso…");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=${encodeURIComponent(
        `${address}, Italia`
      )}`;
      const res = await fetch(url);
      const results = (await res.json()) as { lat: string; lon: string }[];
      if (results.length === 0) {
        setCoords(null);
        setGeoMessage("Nessun risultato: puoi completare la registrazione anche senza coordinate.");
      } else {
        setCoords({ lat: Number(results[0].lat), lng: Number(results[0].lon) });
        setGeoMessage("Coordinate acquisite. La mappa sarà mostrata sulle schede dei farmaci.");
      }
    } catch {
      setGeoMessage("Servizio di geocodifica non disponibile: puoi proseguire senza coordinate.");
    } finally {
      setGeoLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      password: data.get("password"),
      licenseCode: data.get("licenseCode"),
      phone: data.get("phone"),
      address: data.get("address"),
      cap: data.get("cap"),
      city: data.get("city"),
      province: data.get("province"),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
    const res = await fetch("/api/farmacie/registrazione", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.message ?? "Registrazione non riuscita");
      if (json.fields) setFieldErrors(json.fields);
      return;
    }
    router.push("/area-farmacie/dashboard");
    router.refresh();
  }

  const err = (name: string) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-xs text-red-600" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="card mx-auto mt-8 max-w-2xl space-y-5 p-7">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Nome della farmacia *
          </label>
          <input id="name" name="name" type="text" required className="input" placeholder="Farmacia San Marco" />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email *
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          {err("email")}
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password * <span className="font-normal text-slate-400">(min. 8 caratteri)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input"
          />
          {err("password")}
        </div>
        <div>
          <label htmlFor="licenseCode" className="label">
            Codice farmacia / Partita IVA
          </label>
          <input id="licenseCode" name="licenseCode" type="text" className="input" />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Telefono
          </label>
          <input id="phone" name="phone" type="tel" className="input" placeholder="030 123456" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="label">
            Indirizzo
          </label>
          <input id="address" name="address" type="text" className="input" placeholder="Via Roma 12" />
        </div>
        <div>
          <label htmlFor="cap" className="label">
            CAP
          </label>
          <input id="cap" name="cap" type="text" inputMode="numeric" maxLength={5} className="input" />
          {err("cap")}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="city" className="label">
              Città *
            </label>
            <input id="city" name="city" type="text" required className="input" />
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
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <button type="button" onClick={(e) => geocode(e, e.currentTarget.form!)} disabled={geoLoading} className="btn-secondary text-xs">
          {geoLoading ? "Ricerca…" : "Individua coordinate dalla mappa"}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          {geoMessage ??
            "Facoltativo: consente di mostrare la farmacia sulla mappa delle disponibilità."}
        </p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Registrazione in corso…" : "Registra la farmacia"}
      </button>
    </form>
  );
}
