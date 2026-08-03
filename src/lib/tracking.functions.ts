import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// La synchronisation Traccar est désormais entièrement pilotée par
// l'application : la configuration (URL, identifiants) vit uniquement
// dans `system_settings`, gérée par l'administrateur depuis le panneau
// d'administration. Aucun utilisateur final ne saisit ni ne voit de
// jeton d'API. Cette fonction parcourt TOUS les véhicules (toutes
// organisations confondues) et rattache chaque device Traccar au
// véhicule correspondant, quel que soit son propriétaire.
export const syncTraccar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { runTraccarSync } = await import("./traccar-sync.server");

    const { data: adminRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (!adminRows || adminRows.length === 0) {
      throw new Error("Seul un administrateur peut déclencher la synchronisation.");
    }

    return runTraccarSync(supabase, userId);
  });
