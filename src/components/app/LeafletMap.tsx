import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapVehicle = {
  id: string;
  name: string;
  plate?: string | null;
  status: string;
  last_lat?: number | null;
  last_lng?: number | null;
  last_speed?: number | null;
};

export type MapGeofence = {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  color: string;
};

type Props = {
  vehicles?: MapVehicle[];
  geofences?: MapGeofence[];
  track?: Array<{ lat: number; lng: number }>;
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
};

const STATUS_COLOR: Record<string, string> = {
  moving: "#22c55e",
  idle: "#ff8e42",
  offline: "#94a3b8",
};

function markerIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;gap:6px">
      <span style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 0 4px ${color}33;display:block"></span>
      <span style="background:rgba(20,20,16,.85);color:#fff;font:600 11px/1.2 Manrope,sans-serif;padding:3px 7px;border-radius:6px;white-space:nowrap">${label}</span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [8, 8],
  });
}

export default function LeafletMap({
  vehicles = [],
  geofences = [],
  track,
  onMapClick,
  center = [5.3599, -4.0083],
  zoom = 11,
  className = "h-[520px] w-full rounded-xl",
}: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const map = L.map(nodeRef.current, { center, zoom, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      clickRef.current?.(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    geofences.forEach((g) => {
      L.circle([g.center_lat, g.center_lng], {
        radius: g.radius_m,
        color: g.color,
        fillColor: g.color,
        fillOpacity: 0.12,
        weight: 2,
      })
        .bindPopup(`<strong>${g.name}</strong><br/>${g.radius_m} m`)
        .addTo(layer);
      bounds.push([g.center_lat, g.center_lng]);
    });

    if (track && track.length > 1) {
      const pts = track.map((p) => [p.lat, p.lng] as L.LatLngExpression);
      L.polyline(pts, { color: "#ff8e42", weight: 4, opacity: 0.9 }).addTo(layer);
      L.circleMarker(pts[0]!, { radius: 6, color: "#22c55e", fillOpacity: 1 })
        .bindPopup("Départ")
        .addTo(layer);
      L.circleMarker(pts[pts.length - 1]!, { radius: 6, color: "#f43f5e", fillOpacity: 1 })
        .bindPopup("Arrivée")
        .addTo(layer);
      bounds.push(...pts);
    }

    vehicles.forEach((v) => {
      if (v.last_lat == null || v.last_lng == null) return;
      const color = STATUS_COLOR[v.status] ?? "#94a3b8";
      L.marker([v.last_lat, v.last_lng], { icon: markerIcon(color, v.name) })
        .bindPopup(
          `<strong>${v.name}</strong><br/>${v.plate ?? ""}<br/>${Math.round(v.last_speed ?? 0)} km/h`,
        )
        .addTo(layer);
      bounds.push([v.last_lat, v.last_lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.25), { maxZoom: 15 });
    }
  }, [vehicles, geofences, track]);

  return <div ref={nodeRef} className={className} />;
}