import { createFileRoute } from "@tanstack/react-router";
import { Activity, BellRing, CarFront, Gauge } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { MapCanvas } from "@/components/app/MapCanvas";
import { useAlerts, useVehicles, useTrips } from "@/hooks/useMsnData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, statusLabel } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — MSN Tracker" },
      { name: "description", content: "Statistiques temps réel de votre flotte GPS MSN Tracker." },
      { property: "og:title", content: "Tableau de bord — MSN Tracker" },
      { property: "og:description", content: "Statistiques temps réel de votre flotte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: vehicles = [] } = useVehicles();
  const { data: alerts = [] } = useAlerts(6);
  const { data: trips = [] } = useTrips();

  const moving = vehicles.filter((v) => v.status === "moving").length;
  const distance = trips.reduce((s, t) => s + (t.distance_km ?? 0), 0);
  const avgSpeed = vehicles.length
    ? vehicles.reduce((s, v) => s + (v.last_speed ?? 0), 0) / vehicles.length
    : 0;

  const stats = [
    { label: "Véhicules", value: vehicles.length, icon: CarFront },
    { label: "En mouvement", value: moving, icon: Activity },
    { label: "Km parcourus", value: `${distance.toFixed(1)} km`, icon: Gauge },
    { label: "Alertes", value: alerts.length, icon: BellRing },
  ];

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Vue temps réel de votre flotte." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Position des véhicules</CardTitle></CardHeader>
          <CardContent>
            <MapCanvas vehicles={vehicles} className="h-[420px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Vitesse moyenne · {Math.round(avgSpeed)} km/h</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {vehicles.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(v.last_update)}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{statusLabel(v.status)}</span>
              </div>
            ))}
            {vehicles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ajoutez vos véhicules dans la section Flotte pour démarrer.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
