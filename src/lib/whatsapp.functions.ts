import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Envoie un message WhatsApp de test au numéro d'alerte plateforme — admin uniquement. */
export const sendTestWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: adminRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (!adminRows || adminRows.length === 0) {
      throw new Error("Seul un administrateur peut envoyer un message de test.");
    }

    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!settings) throw new Error("Configuration système introuvable.");

    const { notifyPlatformWhatsApp } = await import("./whatsapp.server");
    const sent = await notifyPlatformWhatsApp(
      settings,
      "✅ MSN Tracker\nCeci est un message de test — votre intégration WhatsApp fonctionne correctement.",
    );

    if (!sent) {
      throw new Error(
        "Envoi impossible : vérifiez que WhatsApp est activé, que l'URL, l'instance, le jeton et le numéro d'alerte sont bien renseignés.",
      );
    }
    return { sent: true };
  });
