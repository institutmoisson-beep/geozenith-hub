import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/app/PageHeader";
import { MapCanvas } from "@/components/app/MapCanvas";
import { usePositions, useTrips, useVehicles } from "@/hooks/useMsnData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Historique des trajets — MSN Tracker" },
      { name: "description", content: "Rejouez les trajets de vos véhicules sur la carte." },
      { property: "og:title", content: "Historique des trajets — MSN Tracker" },
      { property: "og:description", content: "Rejouez les trajets de vos véhicules sur la carte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: vehicles = [] } = useVehicles();
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const vehicleId = selected ?? vehicles[0]?.id;
  const { data: positions = [] } = usePositions(vehicleId);
  const { data: trips = [] } = useTrips(vehicleId);

  return (
    <div>
      <PageHeader
        title="Historique des trajets"
        description="Sélectionnez un véhicule pour visualiser son parcours."
        action={
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={vehicleId ?? ""}
            onChange={(e) => setSelected(e.target.value)}
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Parcours ({positions.length} points)</CardTitle></CardHeader>
          <CardContent>
            <MapCanvas
              track={positions.map((p) => ({ lat: p.lat, lng: p.lng }))}
              className="h-[480px] w-full rounded-xl"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trajets</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trips.map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">{t.distance_km.toFixed(1)} km · {t.duration_min} min</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.started_at)}</p>
              </div>
            ))}
            {trips.length === 0 && <p className="text-sm text-muted-foreground">Aucun trajet enregistré.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
