import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { useAlerts, useProfile, useTrips, useVehicles } from "@/hooks/useMsnData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildReport, downloadReport } from "@/lib/pdf";
import { formatDate, statusLabel } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Rapports PDF — MSN Tracker" },
      { name: "description", content: "Générez des rapports de flotte, trajets et alertes au format PDF." },
      { property: "og:title", content: "Rapports PDF — MSN Tracker" },
      { property: "og:description", content: "Générez des rapports de flotte, trajets et alertes au format PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: trips = [] } = useTrips();
  const { data: alerts = [] } = useAlerts();
  const { data: profile } = useProfile();

  function fleetReport() {
    const doc = buildReport(
      { title: "Rapport de flotte", subtitle: "État courant des véhicules", company: profile?.company ?? null },
      ["Véhicule", "Immatriculation", "Statut", "Vitesse", "Dernier point"],
      vehicles.map((v) => [v.name, v.plate ?? "—", statusLabel(v.status), `${Math.round(v.last_speed ?? 0)} km/h`, formatDate(v.last_update)]),
      [`Total véhicules : ${vehicles.length}`],
    );
    downloadReport(doc, "msn-tracker-flotte.pdf");
    toast.success("Rapport généré");
  }

  function tripReport() {
    const total = trips.reduce((s, t) => s + t.distance_km, 0);
    const doc = buildReport(
      { title: "Rapport de trajets", subtitle: "Historique des déplacements", company: profile?.company ?? null },
      ["Départ", "Arrivée", "Distance", "Durée", "Vitesse max"],
      trips.map((t) => [formatDate(t.started_at), formatDate(t.ended_at), `${t.distance_km.toFixed(1)} km`, `${t.duration_min} min`, `${Math.round(t.max_speed)} km/h`]),
      [`Distance totale : ${total.toFixed(1)} km`],
    );
    downloadReport(doc, "msn-tracker-trajets.pdf");
    toast.success("Rapport généré");
  }

  function alertReport() {
    const doc = buildReport(
      { title: "Rapport d'alertes", subtitle: "Événements détectés", company: profile?.company ?? null },
      ["Date", "Type", "Gravité", "Message"],
      alerts.map((a) => [formatDate(a.created_at), a.type, a.severity, a.message]),
      [`Total alertes : ${alerts.length}`],
    );
    downloadReport(doc, "msn-tracker-alertes.pdf");
    toast.success("Rapport généré");
  }

  const cards = [
    { title: "Rapport de flotte", desc: "Inventaire et statut de tous les véhicules.", action: fleetReport },
    { title: "Rapport de trajets", desc: "Distances, durées et vitesses par trajet.", action: tripReport },
    { title: "Rapport d'alertes", desc: "Excès de vitesse et franchissements de zone.", action: alertReport },
  ];

  return (
    <div>
      <PageHeader title="Rapports PDF" description="Documents PDF aux couleurs MSN Tracker." />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader><CardTitle className="text-base">{c.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              <Button className="w-full gap-2" onClick={c.action}>
                <FileText className="h-4 w-4" /> Générer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
