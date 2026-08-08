import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint de synchronisation Traccar appelé par le job pg_cron
 * (`trigger_traccar_sync`). Pas de session utilisateur : l'appel est
 * authentifié par l'en-tête `x-cron-secret` comparé au secret stocké
 * dans `system_settings.cron_secret` (rotatable depuis l'administration).
 */
export const Route = createFileRoute("/api/public/hooks/sync-traccar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runTraccarSync } = await import("@/lib/traccar-sync.server");

        const provided = request.headers.get("x-cron-secret") ?? "";
        const { data: settings } = await supabaseAdmin
          .from("system_settings")
          .select("cron_secret, auto_sync_enabled")
          .maybeSingle();

        const expected = settings?.cron_secret ?? "";
        if (!expected || provided.length !== expected.length || provided !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const result = await runTraccarSync(supabaseAdmin, null);
          await supabaseAdmin
            .from("system_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "success",
              last_sync_error: null,
              last_sync_summary: `${result.devices} boîtiers · ${result.updated} mis à jour · ${result.alerts} alertes`,
            })
            .eq("id", true);
          return Response.json({ success: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur inconnue";
          const { data: freshSettings } = await supabaseAdmin
            .from("system_settings")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_status: "error",
              last_sync_error: message,
            })
            .eq("id", true)
            .select("*")
            .maybeSingle();

          // Notifie tous les admins dans leur boîte de notifications (son inclus).
          const { data: admins } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");
          if (admins && admins.length > 0) {
            await supabaseAdmin.from("alerts").insert(
              admins.map((a) => ({
                user_id: a.user_id,
                vehicle_id: null,
                type: "sync_error",
                severity: "warning",
                message: `Échec de la synchronisation Traccar automatique : ${message.slice(0, 200)}`,
              })) as never[],
            );
          }
          if (freshSettings) {
            const { notifyPlatformWhatsApp } = await import("@/lib/whatsapp.server");
            await notifyPlatformWhatsApp(
              freshSettings,
              `⚠️ MSN Tracker\nLa synchronisation Traccar automatique a échoué : ${message.slice(0, 200)}`,
            );
          }

          console.error("[sync-traccar]", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
