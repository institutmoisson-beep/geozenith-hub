import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  BrainCircuit,
  CarFront,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  KeyRound,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  useAdminAlerts,
  useAdminGeofences,
  useAdminInvoices,
  useAdminSubscriptions,
  useAdminUsers,
  useAdminVehicles,
  useSystemSettings,
  type SystemSettings,
} from "@/hooks/useMsnData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, statusLabel } from "@/lib/msn";
import { syncTraccar } from "@/lib/tracking.functions";
import { sendTestWhatsApp } from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw redirect({ to: "/auth" });
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Administration — MSN Tracker" },
      {
        name: "description",
        content: "Gestion complète de la plateforme : utilisateurs, flotte, configuration.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Administration"
        description="Pilotage complet de la plateforme — configuration technique, utilisateurs et données."
        action={
          <Badge className="gap-1.5 bg-gradient-brand text-primary-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Accès administrateur
          </Badge>
        }
      />

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="system" className="gap-1.5">
            <Server className="h-4 w-4" /> Configuration système
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-1.5">
            <CarFront className="h-4 w-4" /> Véhicules
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5">
            <BellRing className="h-4 w-4" /> Alertes
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1.5">
            <CreditCard className="h-4 w-4" /> Abonnements
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <FileText className="h-4 w-4" /> Factures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemSettingsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="vehicles">
          <VehiclesTab />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>
        <TabsContent value="subscriptions">
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------
// Onglet 1 : Configuration système (Traccar + WhatsApp) — remplace la
// saisie d'API côté utilisateur final.
// ---------------------------------------------------------------------
function SystemSettingsTab() {
  const { data: settings } = useSystemSettings();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [testing, setTesting] = useState(false);
  const runSendTest = useServerFn(sendTestWhatsApp);
  const runSyncTraccar = useServerFn(syncTraccar);
  const [form, setForm] = useState({
    traccar_url: "",
    traccar_username: "",
    traccar_token: "",
    whatsapp_provider_url: "",
    whatsapp_instance_name: "",
    whatsapp_instance_token: "",
    whatsapp_alert_number: "",
    whatsapp_enabled: false,
    default_alert_speed_kmh: "90",
    auto_sync_enabled: false,
    auto_sync_interval_minutes: "5",
    sync_function_url: "",
    ai_enabled: false,
    ollama_url: "",
    ollama_model: "llama3",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        traccar_url: settings.traccar_url ?? "",
        traccar_username: settings.traccar_username ?? "",
        traccar_token: settings.traccar_token ?? "",
        whatsapp_provider_url: settings.whatsapp_provider_url ?? "",
        whatsapp_instance_name: settings.whatsapp_instance_name ?? "",
        whatsapp_instance_token: settings.whatsapp_instance_token ?? "",
        whatsapp_alert_number: settings.whatsapp_alert_number ?? "",
        whatsapp_enabled: settings.whatsapp_enabled,
        default_alert_speed_kmh: String(settings.default_alert_speed_kmh ?? 90),
        auto_sync_enabled: settings.auto_sync_enabled,
        auto_sync_interval_minutes: String(settings.auto_sync_interval_minutes ?? 5),
        sync_function_url: settings.sync_function_url ?? "",
        ai_enabled: settings.ai_enabled ?? false,
        ollama_url: settings.ollama_url ?? "",
        ollama_model: settings.ollama_model ?? "llama3",
      });
    }
  }, [settings]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("system_settings").upsert({
      id: true,
      traccar_url: form.traccar_url || null,
      traccar_username: form.traccar_username || null,
      traccar_token: form.traccar_token || null,
      whatsapp_provider_url: form.whatsapp_provider_url || null,
      whatsapp_instance_name: form.whatsapp_instance_name || null,
      whatsapp_instance_token: form.whatsapp_instance_token || null,
      whatsapp_alert_number: form.whatsapp_alert_number || null,
      whatsapp_enabled: form.whatsapp_enabled,
      default_alert_speed_kmh: Number(form.default_alert_speed_kmh) || 90,
      auto_sync_enabled: form.auto_sync_enabled,
      auto_sync_interval_minutes: Number(form.auto_sync_interval_minutes) || 5,
      sync_function_url: form.sync_function_url || null,
      ai_enabled: form.ai_enabled,
      ollama_url: form.ollama_url || null,
      ollama_model: form.ollama_model || "llama3",
      updated_by: auth.user!.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Configuration système enregistrée");
    qc.invalidateQueries({ queryKey: ["system-settings"] });
  }

  async function runSync() {
    setSyncing(true);
    try {
      const result = await runSyncTraccar({ data: undefined });
      toast.success(
        `Synchronisation : ${result.devices} boîtier(s), ${result.updated} véhicule(s), ${result.alerts} alerte(s).`,
      );
      qc.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      await runSendTest({ data: undefined });
      toast.success("Message de test envoyé — vérifiez le numéro d'alerte plateforme.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du message de test");
    } finally {
      setTesting(false);
    }
  }

  async function rotateSecret() {
    setRotating(true);
    const { error } = await supabase.rpc("admin_rotate_cron_secret");
    setRotating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Secret cron régénéré — la synchro automatique continue de fonctionner sans intervention.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Ces réglages sont centralisés et invisibles pour les utilisateurs finaux : c'est
          l'application qui gère les API, pas eux. Une seule configuration alimente toute la
          plateforme.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Serveur Traccar</CardTitle>
            <CardDescription>
              Connexion unique utilisée pour toute la flotte, tous comptes confondus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-url">URL du serveur</Label>
                <Input
                  id="s-url"
                  placeholder="https://demo.traccar.org"
                  value={form.traccar_url}
                  onChange={(e) => setForm({ ...form, traccar_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-user">Utilisateur (email)</Label>
                <Input
                  id="s-user"
                  value={form.traccar_username}
                  onChange={(e) => setForm({ ...form, traccar_username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-token">Mot de passe / jeton API</Label>
                <Input
                  id="s-token"
                  type="password"
                  value={form.traccar_token}
                  onChange={(e) => setForm({ ...form, traccar_token: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-speed">Seuil d'excès de vitesse par défaut (km/h)</Label>
                <Input
                  id="s-speed"
                  value={form.default_alert_speed_kmh}
                  onChange={(e) => setForm({ ...form, default_alert_speed_kmh: e.target.value })}
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
            <CardTitle>Notifications WhatsApp (Evolution API)</CardTitle>
            <CardDescription>
              Instance Docker connectée par QR code, gérée par l'administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-wa-url">URL du serveur Evolution API</Label>
                <Input
                  id="s-wa-url"
                  placeholder="https://evolution.example.com"
                  value={form.whatsapp_provider_url}
                  onChange={(e) => setForm({ ...form, whatsapp_provider_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-wa-instance">Nom de l'instance</Label>
                <Input
                  id="s-wa-instance"
                  placeholder="msn-tracker"
                  value={form.whatsapp_instance_name}
                  onChange={(e) => setForm({ ...form, whatsapp_instance_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-wa-token">Jeton d'instance (apikey)</Label>
                <Input
                  id="s-wa-token"
                  type="password"
                  value={form.whatsapp_instance_token}
                  onChange={(e) => setForm({ ...form, whatsapp_instance_token: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-wa-number">Numéro d'alerte plateforme</Label>
                <Input
                  id="s-wa-number"
                  placeholder="2250507348685"
                  value={form.whatsapp_alert_number}
                  onChange={(e) => setForm({ ...form, whatsapp_alert_number: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <Label htmlFor="s-wa-enabled" className="cursor-pointer text-sm font-normal">
                  Activer les notifications WhatsApp
                </Label>
                <Switch
                  id="s-wa-enabled"
                  checked={form.whatsapp_enabled}
                  onCheckedChange={(v) => setForm({ ...form, whatsapp_enabled: v })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Enregistrer
                </Button>
                <Button type="button" variant="outline" onClick={sendTest} disabled={testing}>
                  {testing ? "Envoi…" : "Envoyer un test"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> Analyse IA (Ollama)
          </CardTitle>
          <CardDescription>
            Serveur LLaMA 3 auto-hébergé pour l'analyse de conduite et la détection d'anomalies.
            Aucune donnée n'est envoyée à un tiers externe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="s-ollama-url">URL du serveur Ollama</Label>
              <Input
                id="s-ollama-url"
                placeholder="https://ollama.example.com"
                value={form.ollama_url}
                onChange={(e) => setForm({ ...form, ollama_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="s-ollama-model">Modèle</Label>
              <Input
                id="s-ollama-model"
                placeholder="llama3"
                value={form.ollama_model}
                onChange={(e) => setForm({ ...form, ollama_model: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 md:col-span-2">
              <Label htmlFor="s-ai-enabled" className="cursor-pointer text-sm font-normal">
                Activer l'analyse IA pour tous les comptes
              </Label>
              <Switch
                id="s-ai-enabled"
                checked={form.ai_enabled}
                onCheckedChange={(v) => setForm({ ...form, ai_enabled: v })}
              />
            </div>
            <Button type="submit" className="md:col-span-2">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synchronisation GPS automatique</CardTitle>
          <CardDescription>
            Un job planifié (toutes les minutes) vérifie s'il est temps de synchroniser, puis
            appelle un point d'entrée sécurisé de votre application — la flotte se met à jour toute
            seule, sans bouton à cliquer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SyncStatusBanner settings={settings} />

          <div className="flex flex-wrap items-center gap-4">
            <Button className="gap-2" onClick={runSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Synchronisation…" : "Forcer une synchro maintenant"}
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                id="s-auto"
                checked={form.auto_sync_enabled}
                onCheckedChange={(v) => setForm({ ...form, auto_sync_enabled: v })}
              />
              <Label htmlFor="s-auto" className="cursor-pointer text-sm font-normal">
                Synchronisation automatique
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="s-interval" className="text-sm text-muted-foreground">
                Toutes les
              </Label>
              <Input
                id="s-interval"
                className="w-20"
                value={form.auto_sync_interval_minutes}
                onChange={(e) => setForm({ ...form, auto_sync_interval_minutes: e.target.value })}
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <Button variant="secondary" onClick={save}>
              Enregistrer
            </Button>
          </div>

          <div className="space-y-1.5 border-t border-border pt-4">
            <Label htmlFor="s-fn-url">URL du point d'entrée de synchronisation (webhook)</Label>
            <div className="flex gap-2">
              <Input
                id="s-fn-url"
                className="font-mono text-xs"
                placeholder="https://votre-app.lovable.app/api/public/hooks/sync-traccar"
                value={form.sync_function_url}
                onChange={(e) => setForm({ ...form, sync_function_url: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={save}>
                Enregistrer
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              L'adresse publique de votre application, suivie de{" "}
              <code>/api/public/hooks/sync-traccar</code>. C'est cette URL que le job planifié
              appelle toutes les minutes — vérifiez qu'elle correspond bien à votre domaine actuel
              (Lovable ou domaine personnalisé) après chaque changement de domaine.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4" /> Secret interne cron ↔ webhook de synchro
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={rotateSecret}
              disabled={rotating}
            >
              {rotating ? "Régénération…" : "Régénérer le secret"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SyncStatusBanner({ settings }: { settings: SystemSettings | null | undefined }) {
  if (!settings?.last_sync_status) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" /> Aucune synchronisation effectuée pour l'instant.
      </div>
    );
  }

  const map = {
    running: {
      icon: RefreshCw,
      className: "text-blue-500 animate-spin",
      label: "Synchronisation en cours…",
    },
    success: {
      icon: CheckCircle2,
      className: "text-emerald-500",
      label: settings.last_sync_summary ?? "Dernière synchro réussie",
    },
    error: {
      icon: XCircle,
      className: "text-destructive",
      label: settings.last_sync_error ?? "Échec de la dernière synchro",
    },
  } as const;

  const state = map[settings.last_sync_status as keyof typeof map] ?? map.success;
  const Icon = state.icon;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
      <Icon className={`h-4 w-4 shrink-0 ${state.className}`} />
      <span>{state.label}</span>
      {settings.last_sync_at && (
        <span className="text-xs text-muted-foreground">— {formatDate(settings.last_sync_at)}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Onglet 2 : Utilisateurs & rôles
// ---------------------------------------------------------------------
function UsersTab() {
  const { data: users = [], isLoading } = useAdminUsers();
  const qc = useQueryClient();

  async function toggleAdmin(userId: string, isCurrentlyAdmin: boolean) {
    const { error } = await supabase.rpc("admin_set_role", {
      _user_id: userId,
      _role: "admin",
      _grant: !isCurrentlyAdmin,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isCurrentlyAdmin ? "Rôle admin retiré" : "Rôle admin accordé");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisateurs de la plateforme</CardTitle>
        <CardDescription>
          {users.length} compte(s) — gérez les rôles et consultez l'activité.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom / Société</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôles</TableHead>
              <TableHead>Véhicules</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => {
              const isAdmin = (u.roles ?? []).includes("admin");
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.company || ""}</div>
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).map((r) => (
                        <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{u.vehicle_count ?? 0}</TableCell>
                  <TableCell className="text-sm capitalize">{u.plan ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {u.created_at ? formatDate(u.created_at) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={isAdmin ? "destructive" : "outline"}
                      onClick={() => toggleAdmin(u.id, isAdmin)}
                    >
                      {isAdmin ? "Retirer admin" : "Nommer admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Onglet 3 : Véhicules (toutes organisations)
// ---------------------------------------------------------------------
function VehiclesTab() {
  const { data: vehicles = [], isLoading } = useAdminVehicles();
  const qc = useQueryClient();

  async function removeVehicle(id: string) {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Véhicule supprimé");
    qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les véhicules</CardTitle>
        <CardDescription>
          {vehicles.length} véhicule(s) enregistré(s) sur la plateforme.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Plaque</TableHead>
              <TableHead>Boîtier Traccar</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Vitesse</TableHead>
              <TableHead>Dernière MAJ</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell className="text-sm">{v.plate || "—"}</TableCell>
                <TableCell className="text-sm">{v.traccar_device_id || "Non rattaché"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{statusLabel(v.status)}</Badge>
                </TableCell>
                <TableCell className="text-sm">{Math.round(v.last_speed ?? 0)} km/h</TableCell>
                <TableCell className="text-sm">
                  {v.last_update ? formatDate(v.last_update) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeVehicle(v.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Onglet 4 : Alertes (toutes organisations)
// ---------------------------------------------------------------------
function AlertsTab() {
  const { data: alerts = [], isLoading } = useAdminAlerts();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Toutes les alertes</CardTitle>
        <CardDescription>
          {alerts.length} alerte(s) récente(s), toutes flottes confondues.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Sévérité</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {alerts.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm">{a.type}</TableCell>
                <TableCell className="text-sm">{a.message}</TableCell>
                <TableCell>
                  <Badge variant={a.severity === "warning" ? "destructive" : "secondary"}>
                    {a.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatDate(a.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Onglet 5 : Abonnements
// ---------------------------------------------------------------------
function SubscriptionsTab() {
  const { data: subs = [], isLoading } = useAdminSubscriptions();
  const qc = useQueryClient();

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("subscriptions").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Abonnement mis à jour");
    qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnements</CardTitle>
        <CardDescription>{subs.length} abonnement(s).</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Limite véhicules</TableHead>
              <TableHead>Prix (FCFA)</TableHead>
              <TableHead>Renouvellement</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {subs.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium capitalize">{s.plan}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>{s.vehicle_limit}</TableCell>
                <TableCell>{s.price_fcfa.toLocaleString("fr-FR")}</TableCell>
                <TableCell className="text-sm">{formatDate(s.renews_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatus(s.id, s.status === "active" ? "suspended" : "active")
                    }
                  >
                    {s.status === "active" ? "Suspendre" : "Activer"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Onglet 6 : Factures
// ---------------------------------------------------------------------
function InvoicesTab() {
  const { data: invoices = [], isLoading } = useAdminInvoices();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Factures</CardTitle>
        <CardDescription>{invoices.length} facture(s) émise(s).</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Émise le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.number}</TableCell>
                <TableCell className="capitalize">{inv.plan}</TableCell>
                <TableCell>{inv.amount_fcfa.toLocaleString("fr-FR")} FCFA</TableCell>
                <TableCell>
                  <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatDate(inv.issued_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
