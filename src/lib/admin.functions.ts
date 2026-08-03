import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  roles: string[];
  vehicle_count: number;
  plan: string | null;
  status: string | null;
  created_at: string | null;
};

/** Liste tous les utilisateurs de la plateforme — administrateurs uniquement. */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    const { supabase, userId } = context;

    const { data: myRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (roleError) throw new Error(roleError.message);
    if (!myRoles || myRoles.length === 0) {
      throw new Error("Accès refusé : réservé aux administrateurs");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [authUsers, profiles, roles, vehicles, subs] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("profiles").select("id, full_name, company, phone"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("vehicles").select("id, user_id"),
      supabaseAdmin.from("subscriptions").select("user_id, plan, status"),
    ]);

    if (authUsers.error) throw new Error(authUsers.error.message);

    const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));
    const subMap = new Map((subs.data ?? []).map((s) => [s.user_id, s]));
    const roleMap = new Map<string, string[]>();
    for (const r of roles.data ?? []) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as string]);
    }
    const vehicleCount = new Map<string, number>();
    for (const v of vehicles.data ?? []) {
      if (!v.user_id) continue;
      vehicleCount.set(v.user_id, (vehicleCount.get(v.user_id) ?? 0) + 1);
    }

    return authUsers.data.users
      .map((u) => {
        const p = profileMap.get(u.id);
        const s = subMap.get(u.id);
        return {
          id: u.id,
          email: u.email ?? null,
          full_name: p?.full_name ?? null,
          company: p?.company ?? null,
          phone: p?.phone ?? null,
          roles: roleMap.get(u.id) ?? [],
          vehicle_count: vehicleCount.get(u.id) ?? 0,
          plan: s?.plan ?? null,
          status: s?.status ?? null,
          created_at: u.created_at ?? null,
        };
      })
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  });