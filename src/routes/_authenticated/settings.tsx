import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { useProfile, useSettings } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — MSN Tracker" },
      {
        name: "description",
        content: "Vos préférences de notification et informations de compte.",
      },
      { property: "og:title", content: "Paramètres — MSN Tracker" },
      {
        property: "og:description",
        content: "Vos préférences de notification et informations de compte.",
      },
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
  const [form, setForm] = useState({
    whatsapp_number: "",
    whatsapp_enabled: true,
    alert_speed_kmh: "90",
  });
  const [prof, setProf] = useState({ full_name: "", company: "", phone: "" });

  useEffect(() => {
    if (settings) {
      setForm({
        whatsapp_number: settings.whatsapp_number ?? "",
        whatsapp_enabled: settings.whatsapp_enabled ?? true,
        alert_speed_kmh: String(settings.alert_speed_kmh ?? 90),
      });
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setProf({
        full_name: profile.full_name ?? "",
        company: profile.company ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("integration_settings").upsert({
      user_id: auth.user!.id,
      whatsapp_number: form.whatsapp_number || null,
      whatsapp_enabled: form.whatsapp_enabled,
      alert_speed_kmh: Number(form.alert_speed_kmh) || 90,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Préférences enregistrées");
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

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Notifications personnelles et informations de compte."
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          La connexion au serveur de géolocalisation (Traccar) et les notifications WhatsApp
          globales sont gérées automatiquement par la plateforme — vous n'avez aucune clé d'API à
          configurer. Un administrateur s'occupe de cette partie technique pour vous.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4" /> Mes notifications
            </CardTitle>
            <CardDescription>Alertes personnelles envoyées sur votre WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-wa">Mon numéro WhatsApp</Label>
                <Input
                  id="t-wa"
                  placeholder="2250507348685"
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <Label htmlFor="wa-enabled" className="cursor-pointer text-sm font-normal">
                  Recevoir mes alertes par WhatsApp
                </Label>
                <Switch
                  id="wa-enabled"
                  checked={form.whatsapp_enabled}
                  onCheckedChange={(v) => setForm({ ...form, whatsapp_enabled: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-speed">Seuil d'excès de vitesse personnel (km/h)</Label>
                <Input
                  id="t-speed"
                  value={form.alert_speed_kmh}
                  onChange={(e) => setForm({ ...form, alert_speed_kmh: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nom complet</Label>
                <Input
                  id="p-name"
                  value={prof.full_name}
                  onChange={(e) => setProf({ ...prof, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-company">Société</Label>
                <Input
                  id="p-company"
                  value={prof.company}
                  onChange={(e) => setProf({ ...prof, company: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Téléphone</Label>
                <Input
                  id="p-phone"
                  value={prof.phone}
                  onChange={(e) => setProf({ ...prof, phone: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Mettre à jour
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
