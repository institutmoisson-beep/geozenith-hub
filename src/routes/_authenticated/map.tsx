import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { MapCanvas } from "@/components/app/MapCanvas";
import { useGeofences, useVehicles } from "@/hooks/useMsnData";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Carte temps réel — MSN Tracker" },
      { name: "description", content: "Suivez vos véhicules en direct sur OpenStreetMap." },
      { property: "og:title", content: "Carte temps réel — MSN Tracker" },
      { property: "og:description", content: "Suivez vos véhicules en direct sur OpenStreetMap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: geofences = [] } = useGeofences();
  return (
    <div>
      <PageHeader title="Carte temps réel" description="OpenStreetMap · positions actualisées toutes les 20 secondes." />
      <MapCanvas vehicles={vehicles} geofences={geofences} className="h-[70vh] w-full rounded-xl border border-border" />
    </div>
  );
}
