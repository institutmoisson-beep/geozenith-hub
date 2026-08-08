import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;
type SystemSettings = Database["public"]["Tables"]["system_settings"]["Row"];

/**
 * Envoie un message texte WhatsApp via une instance Evolution API.
 * Endpoint officiel : POST {server-url}/message/sendText/{instance}
 * Header : apikey: <token>  ·  Body : { number, text }
 */
export async function sendEvolutionMessage(
  serverUrl: string,
  instanceName: string,
  token: string,
  number: string,
  text: string,
): Promise<void> {
  const root = serverUrl.replace(/\/+$/, "");
  const digits = number.replace(/[^0-9]/g, "");
  const res = await fetch(`${root}/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: token },
    body: JSON.stringify({ number: digits, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution API a répondu ${res.status} : ${body.slice(0, 300)}`);
  }
}

/**
 * Envoie l'alerte WhatsApp personnelle d'un utilisateur si :
 *  - la plateforme a WhatsApp activé et configuré (system_settings),
 *  - l'utilisateur a activé ses notifications WhatsApp et renseigné son numéro.
 * N'échoue jamais bruyamment : une erreur d'envoi est journalisée mais ne
 * doit jamais interrompre la synchronisation ou la création d'alerte.
 */
export async function notifyUserWhatsApp(
  supabase: Client,
  settings: SystemSettings,
  userId: string,
  text: string,
): Promise<boolean> {
  if (
    !settings.whatsapp_enabled ||
    !settings.whatsapp_provider_url ||
    !settings.whatsapp_instance_name ||
    !settings.whatsapp_instance_token
  ) {
    return false;
  }
  const { data: prefs } = await supabase
    .from("integration_settings")
    .select("whatsapp_enabled, whatsapp_number")
    .eq("user_id", userId)
    .maybeSingle();

  if (!prefs?.whatsapp_enabled || !prefs.whatsapp_number) return false;

  try {
    await sendEvolutionMessage(
      settings.whatsapp_provider_url,
      settings.whatsapp_instance_name,
      settings.whatsapp_instance_token,
      prefs.whatsapp_number,
      text,
    );
    return true;
  } catch (error) {
    console.error("[whatsapp] Échec d'envoi :", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Envoie un message au numéro d'alerte plateforme (usage admin / broadcast). */
export async function notifyPlatformWhatsApp(
  settings: SystemSettings,
  text: string,
): Promise<boolean> {
  if (
    !settings.whatsapp_enabled ||
    !settings.whatsapp_provider_url ||
    !settings.whatsapp_instance_name ||
    !settings.whatsapp_instance_token ||
    !settings.whatsapp_alert_number
  ) {
    return false;
  }
  try {
    await sendEvolutionMessage(
      settings.whatsapp_provider_url,
      settings.whatsapp_instance_name,
      settings.whatsapp_instance_token,
      settings.whatsapp_alert_number,
      text,
    );
    return true;
  } catch (error) {
    console.error(
      "[whatsapp] Échec d'envoi (plateforme) :",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
