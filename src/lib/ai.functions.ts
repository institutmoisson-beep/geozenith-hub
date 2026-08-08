import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Analyse IA de la flotte via le serveur Ollama (Llama 3) configuré par
 * l'administrateur. Réservée aux utilisateurs connectés : l'analyse porte
 * uniquement sur les données visibles par l'appelant (RLS).
 */
export const generateFleetInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { buildFleetPrompt, askOllama } = await import("./ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // system_settings n'est lisible que par les admins via RLS (RGPD/sécurité) ;
    // on lit donc la config Ollama avec le client service_role. Les données de
    // flotte utilisées dans le prompt, elles, restent scopées par RLS via `supabase`.
    const { data: settings } = await supabaseAdmin
      .from("system_settings")
      .select("ai_enabled, ollama_url, ollama_model")
      .maybeSingle();
    if (!settings?.ai_enabled) {
      throw new Error("L'analyse IA est désactivée par l'administrateur.");
    }
    if (!settings.ollama_url) {
      throw new Error("Aucun serveur Ollama configuré (Administration → Configuration système).");
    }

    const [{ data: vehicles }, { data: trips }, { data: alerts }] = await Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("trips").select("*").order("started_at", { ascending: false }).limit(50),
      supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const prompt = buildFleetPrompt(vehicles ?? [], trips ?? [], alerts ?? []);
    const model = settings.ollama_model || "llama3";
    const content = await askOllama(settings.ollama_url, model, prompt);

    const { data: insight, error } = await supabase
      .from("ai_insights")
      .insert({ user_id: userId, scope: "fleet", vehicle_id: null, model, content })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { insight };
  });
