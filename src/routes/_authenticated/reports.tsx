import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import {
  useAiInsights,
  useAlerts,
  useInvoices,
  useProfile,
  useSystemSettings,
  useTrips,
  useVehicles,
} from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFullReport, buildReport, downloadReport } from "@/lib/pdf";
import { formatDate, statusLabel } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Rapports PDF — MSN Tracker" },
      {
        name: "description",
        content: "Générez des rapports de flotte, trajets, alertes et analyses IA au format PDF.",
      },
      { property: "og:title", content: "Rapports PDF — MSN Tracker" },
      {
        property: "og:description",
        content: "Générez des rapports de flotte, trajets, alertes et analyses IA au format PDF.",
      },
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
  const { data: invoices = [] } = useInvoices();
  const { data: profile } = useProfile();
  const [lastAiSummary, setLastAiSummary] = useState<string | null>(null);

  function fleetReport() {
    const doc = buildReport(
      {
        title: "Rapport de flotte",
        subtitle: "État courant des véhicules",
        company: profile?.company ?? null,
      },
      ["Véhicule", "Immatriculation", "Statut", "Vitesse", "Dernier point"],
      vehicles.map((v) => [
        v.name,
        v.plate ?? "—",
        statusLabel(v.status),
        `${Math.round(v.last_speed ?? 0)} km/h`,
        formatDate(v.last_update),
      ]),
      [`Total véhicules : ${vehicles.length}`],
    );
    downloadReport(doc, "msn-tracker-flotte.pdf");
    toast.success("Rapport généré");
  }

  function tripReport() {
    const total = trips.reduce((s, t) => s + t.distance_km, 0);
    const doc = buildReport(
      {
        title: "Rapport de trajets",
        subtitle: "Historique des déplacements",
        company: profile?.company ?? null,
      },
      ["Départ", "Arrivée", "Distance", "Durée", "Vitesse max"],
      trips.map((t) => [
        formatDate(t.started_at),
        formatDate(t.ended_at),
        `${t.distance_km.toFixed(1)} km`,
        `${t.duration_min} min`,
        `${Math.round(t.max_speed)} km/h`,
      ]),
      [`Distance totale : ${total.toFixed(1)} km`],
    );
    downloadReport(doc, "msn-tracker-trajets.pdf");
    toast.success("Rapport généré");
  }

  function alertReport() {
    const doc = buildReport(
      {
        title: "Rapport d'alertes",
        subtitle: "Événements détectés",
        company: profile?.company ?? null,
      },
      ["Date", "Type", "Gravité", "Message"],
      alerts.map((a) => [formatDate(a.created_at), a.type, a.severity, a.message]),
      [`Total alertes : ${alerts.length}`],
    );
    downloadReport(doc, "msn-tracker-alertes.pdf");
    toast.success("Rapport généré");
  }

  function fullReport() {
    const totalDistance = trips.reduce((s, t) => s + t.distance_km, 0);
    const online = vehicles.filter((v) => v.status !== "offline").length;
    const unpaidInvoices = invoices.filter((i) => i.status !== "paid").length;

    const doc = buildFullReport(
      {
        title: "Rapport complet de flotte",
        subtitle: "Synthèse flotte, trajets, alertes et facturation",
        company: profile?.company ?? null,
      },
      [
        { label: "Véhicules actifs", value: `${online}/${vehicles.length}` },
        { label: "Distance (trajets)", value: `${totalDistance.toFixed(0)} km` },
        { label: "Alertes non lues", value: `${alerts.filter((a) => !a.is_read).length}` },
        { label: "Factures en attente", value: `${unpaidInvoices}` },
      ],
      [
        {
          title: "Flotte",
          head: ["Véhicule", "Immatriculation", "Statut", "Vitesse", "Dernier point"],
          rows: vehicles.map((v) => [
            v.name,
            v.plate ?? "—",
            statusLabel(v.status),
            `${Math.round(v.last_speed ?? 0)} km/h`,
            formatDate(v.last_update),
          ]),
        },
        {
          title: "Trajets récents",
          head: ["Départ", "Arrivée", "Distance", "Durée", "Vitesse max"],
          rows: trips
            .slice(0, 40)
            .map((t) => [
              formatDate(t.started_at),
              formatDate(t.ended_at),
              `${t.distance_km.toFixed(1)} km`,
              `${t.duration_min} min`,
              `${Math.round(t.max_speed)} km/h`,
            ]),
          note: `Distance totale sur la période : ${totalDistance.toFixed(1)} km`,
        },
        {
          title: "Alertes",
          head: ["Date", "Type", "Gravité", "Message"],
          rows: alerts
            .slice(0, 40)
            .map((a) => [formatDate(a.created_at), a.type, a.severity, a.message]),
        },
        {
          title: "Facturation",
          head: ["Numéro", "Plan", "Montant", "Statut", "Émise le"],
          rows: invoices.map((i) => [
            i.number,
            i.plan,
            `${i.amount_fcfa.toLocaleString("fr-FR")} FCFA`,
            i.status,
            formatDate(i.issued_at),
          ]),
        },
      ],
      lastAiSummary,
    );
    downloadReport(doc, "msn-tracker-rapport-complet.pdf");
    toast.success("Rapport complet généré");
  }

  const cards = [
    {
      title: "Rapport de flotte",
      desc: "Inventaire et statut de tous les véhicules.",
      action: fleetReport,
    },
    {
      title: "Rapport de trajets",
      desc: "Distances, durées et vitesses par trajet.",
      action: tripReport,
    },
    {
      title: "Rapport d'alertes",
      desc: "Excès de vitesse et franchissements de zone.",
      action: alertReport,
    },
  ];

  return (
    <div>
      <PageHeader title="Rapports PDF" description="Documents PDF aux couleurs MSN Tracker." />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <CardTitle className="text-base">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              <Button className="w-full gap-2" onClick={c.action}>
                <FileText className="h-4 w-4" /> Générer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Rapport complet (avancé)</CardTitle>
            <CardDescription>
              Un seul PDF multi-pages : indicateurs clés, flotte, trajets, alertes, facturation — et
              l'analyse IA la plus récente si vous en avez généré une ci-contre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2" onClick={fullReport}>
              <FileText className="h-4 w-4" /> Générer le rapport complet
            </Button>
          </CardContent>
        </Card>

        <AiInsightsCard onGenerated={setLastAiSummary} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Analyse IA de la flotte (Ollama, configuré par l'admin)
// ---------------------------------------------------------------------
function AiInsightsCard({ onGenerated }: { onGenerated: (content: string) => void }) {
  const { data: sysSettings } = useSystemSettings();
  const { data: insights = [] } = useAiInsights(); // scope flotte (vehicleId undefined)
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const latest = insights[0];

  async function generate() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fleet-insights", { body: {} });
      if (error) throw error;
      toast.success("Analyse IA générée");
      onGenerated(data.insight.content);
      qc.invalidateQueries({ queryKey: ["ai-insights"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'analyse IA");
    } finally {
      setGenerating(false);
    }
  }

  if (!sysSettings?.ai_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4" /> Analyse IA de la flotte
          </CardTitle>
          <CardDescription>
            Fonctionnalité désactivée pour l'instant — un administrateur peut l'activer depuis
            Administration → Configuration système.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BrainCircuit className="h-4 w-4" /> Analyse IA de la flotte
        </CardTitle>
        <CardDescription>
          Anomalies de conduite, usure estimée et recommandations générées par votre serveur Ollama.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full gap-2" onClick={generate} disabled={generating}>
          <Sparkles className={`h-4 w-4 ${generating ? "animate-pulse" : ""}`} />
          {generating ? "Analyse en cours…" : "Générer une analyse IA"}
        </Button>
        {latest && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-1 text-xs text-muted-foreground">
              Dernière analyse — {formatDate(latest.created_at)}
            </p>
            <p className="whitespace-pre-wrap text-sm">{latest.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
