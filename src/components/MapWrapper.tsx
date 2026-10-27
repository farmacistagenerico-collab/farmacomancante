"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./PharmacyMap";

export type { MapMarker };

const PharmacyMap = dynamic(() => import("./PharmacyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
      Caricamento mappa…
    </div>
  ),
});

export function MapWrapper({ markers }: { markers: MapMarker[] }) {
  return <PharmacyMap markers={markers} />;
}
