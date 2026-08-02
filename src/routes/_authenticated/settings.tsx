import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { useProfile, useSettings } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { syncTraccar } from "@/lib/tracking.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — MSN Tracker" },
      { name: "description", content: "Connectez votre serveur Traccar et vos notifications WhatsApp." },
      { property: "og:title", content: "Paramètres — MSN Tracker" },
      { property: "og:description", content: "Connectez votre serveur Traccar et vos notifications WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSettings();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ traccar_url: "", traccar_username: "", traccar_token: "", whatsapp_number: "", alert_speed_kmh: "90" });
  const [prof, setProf] = useState({ full_name: "", company: "", phone: "" });

  useEffect(() => {
    if (settings) {
      setForm({
        traccar_url: settings.traccar_url ?? "",
        traccar_username: settings.traccar_username ?? "",
        traccar_token: settings.traccar_token ?? "",
        whatsapp_number: settings.whatsapp_number ?? "",
        alert_speed_kmh: String(settings.alert_speed_kmh ?? 90),
      });
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setProf({ full_name: profile.full_name ?? "", company: profile.company ?? "", phone: profile.phone ?? "" });
    }
  }, [profile]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("integration_settings").upsert({
      user_id: auth.user!.id,
      traccar_url: form.traccar_url || null,
      traccar_username: form.traccar_username || null,
      traccar_token: form.traccar_token || null,
      whatsapp_number: form.whatsapp_number || null,
      alert_speed_kmh: Number(form.alert_speed_kmh) || 90,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paramètres enregistrés");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update(prof).eq("id", auth.user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil mis à jour");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function runSync() {
    setSyncing(true);
    try {
      const result = await syncTraccar({ data: undefined });
      toast.success(`Synchronisation : ${result.devices} boîtier(s), ${result.alerts} alerte(s).`);
      qc.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Traccar, WhatsApp et informations de compte."
        action={
          <Button className="gap-2" onClick={runSync} disabled={syncing}>
            <RefreshCw className="h-4 w-4" /> {syncing ? "Synchronisation…" : "Synchroniser Traccar"}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Connexion Traccar</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-url">URL du serveur</Label>
                <Input id="t-url" placeholder="https://demo.traccar.org" value={form.traccar_url} onChange={(e) => setForm({ ...form, traccar_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-user">Utilisateur (email)</Label>
                <Input id="t-user" value={form.traccar_username} onChange={(e) => setForm({ ...form, traccar_username: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-token">Mot de passe / jeton API</Label>
                <Input id="t-token" type="password" value={form.traccar_token} onChange={(e) => setForm({ ...form, traccar_token: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-wa">Numéro WhatsApp d'alerte</Label>
                <Input id="t-wa" placeholder="2250507348685" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-speed">Seuil d'excès de vitesse (km/h)</Label>
                <Input id="t-speed" value={form.alert_speed_kmh} onChange={(e) => setForm({ ...form, alert_speed_kmh: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mon profil</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nom complet</Label>
                <Input id="p-name" value={prof.full_name} onChange={(e) => setProf({ ...prof, full_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-company">Société</Label>
                <Input id="p-company" value={prof.company} onChange={(e) => setProf({ ...prof, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Téléphone</Label>
                <Input id="p-phone" value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Mettre à jour</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
