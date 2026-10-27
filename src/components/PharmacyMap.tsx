"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  lat: number;
  lng: number;
  name: string;
  city: string;
  address?: string | null;
}

export default function PharmacyMap({ markers }: { markers: MapMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || markers.length === 0) return;

    const map = L.map(containerRef.current).setView([markers[0].lat, markers[0].lng], 12);
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const pin = L.divIcon({
      className: "",
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0f766e" class="h-8 w-8 drop-shadow">
        <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7.05 11.5 7.35 11.76a1 1 0 0 0 1.3 0C12.95 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -30],
    });

    const bounds: L.LatLngTuple[] = [];
    for (const m of markers) {
      L.marker([m.lat, m.lng], { icon: pin })
        .addTo(map)
        .bindPopup(
          `<strong>${m.name}</strong><br/>${m.address ? m.address + "<br/>" : ""}${m.city}`
        );
      bounds.push([m.lat, m.lng]);
    }
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
  }, [markers]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-80 w-full" aria-label="Mappa delle farmacie" />;
}
