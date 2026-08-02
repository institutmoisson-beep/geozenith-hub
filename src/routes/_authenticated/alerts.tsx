import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, MessageCircle, Volume2, VolumeX } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { useAlerts, useSettings } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationChime } from "@/lib/notification-sound";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, whatsappLink, SUPPORT_WA } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Notifications — MSN Tracker" },
      {
        name: "description",
        content: "Votre boîte de notifications : alertes, événements et notifications WhatsApp.",
      },
      { property: "og:title", content: "Notifications — MSN Tracker" },
      {
        property: "og:description",
        content: "Votre boîte de notifications : alertes, événements et notifications WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data: alerts = [] } = useAlerts();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const unread = alerts.filter((a) => !a.is_read).length;

  async function markRead(id: string) {
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-recent"] });
  }

  async function markAllRead() {
    await supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-recent"] });
    toast.success("Toutes les notifications ont été marquées comme lues");
  }

  async function toggleSound() {
    const { data: auth } = await supabase.auth.getUser();
    const next = !(settings?.sound_enabled ?? true);
    await supabase
      .from("integration_settings")
      .upsert({ user_id: auth.user!.id, sound_enabled: next });
    qc.invalidateQueries({ queryKey: ["settings"] });
    if (next) playNotificationChime();
    toast.success(next ? "Son des notifications activé" : "Son des notifications désactivé");
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} notification(s) non lue(s) — reçues en temps réel avec un signal sonore.`
            : "Vous êtes à jour. Les nouvelles notifications sonnent automatiquement."
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={toggleSound}>
              {(settings?.sound_enabled ?? true) ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              Son {(settings?.sound_enabled ?? true) ? "activé" : "coupé"}
            </Button>
            {unread > 0 && (
              <Button className="gap-2" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4" /> Tout marquer lu
              </Button>
            )}
          </div>
        }
      />
      <div className="space-y-3">
        {alerts.map((a) => (
          <Card key={a.id} className={a.is_read ? "opacity-60" : "border-primary/30"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{a.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.type} · {formatDate(a.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={whatsappLink(
                    settings?.whatsapp_number || SUPPORT_WA,
                    `MSN Tracker — ${a.message}`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="secondary" className="gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
                {!a.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2"
                    onClick={() => markRead(a.id)}
                  >
                    <Check className="h-4 w-4" /> Lu
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune notification pour l'instant.</p>
        )}
      </div>
    </div>
  );
}
