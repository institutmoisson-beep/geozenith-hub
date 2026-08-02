import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { useAlerts, useSettings } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, whatsappLink, SUPPORT_WA } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alertes — MSN Tracker" },
      { name: "description", content: "Excès de vitesse, entrées de zone et notifications WhatsApp." },
      { property: "og:title", content: "Alertes — MSN Tracker" },
      { property: "og:description", content: "Excès de vitesse, entrées de zone et notifications WhatsApp." },
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

  async function markRead(id: string) {
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  return (
    <div>
      <PageHeader title="Alertes" description="Notifiez vos équipes par WhatsApp en un clic." />
      <div className="space-y-3">
        {alerts.map((a) => (
          <Card key={a.id} className={a.is_read ? "opacity-60" : ""}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{a.message}</p>
                <p className="text-xs text-muted-foreground">{a.type} · {formatDate(a.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={whatsappLink(settings?.whatsapp_number || SUPPORT_WA, `MSN Tracker — ${a.message}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="secondary" className="gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </a>
                {!a.is_read && (
                  <Button size="sm" variant="ghost" className="gap-2" onClick={() => markRead(a.id)}>
                    <Check className="h-4 w-4" /> Lu
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte pour l'instant.</p>}
      </div>
    </div>
  );
}
