import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Vehicle = Tables<"vehicles">;
export type Geofence = Tables<"geofences">;
export type Alert = Tables<"alerts">;
export type Trip = Tables<"trips">;
export type Position = Tables<"positions">;
export type Invoice = Tables<"invoices">;
export type Subscription = Tables<"subscriptions">;
export type Profile = Tables<"profiles">;
export type Settings = Tables<"integration_settings">;
export type SystemSettings = Tables<"system_settings">;
export type UserRole = Tables<"user_roles">;
export type AiInsight = Tables<"ai_insights">;

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }) {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () =>
      unwrap<Vehicle[]>(
        await supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      ),
    refetchInterval: 20000,
  });
}

export function useGeofences() {
  return useQuery({
    queryKey: ["geofences"],
    queryFn: async () =>
      unwrap<Geofence[]>(
        await supabase.from("geofences").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useAlerts(limit = 100) {
  return useQuery({
    queryKey: ["alerts", limit],
    queryFn: async () =>
      unwrap<Alert[]>(
        await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ),
    refetchInterval: 30000,
  });
}

export function useTrips(vehicleId?: string) {
  return useQuery({
    queryKey: ["trips", vehicleId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("trips")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      return unwrap<Trip[]>(await q);
    },
  });
}

export function usePositions(vehicleId?: string) {
  return useQuery({
    queryKey: ["positions", vehicleId ?? "none"],
    enabled: Boolean(vehicleId),
    queryFn: async () =>
      unwrap<Position[]>(
        await supabase
          .from("positions")
          .select("*")
          .eq("vehicle_id", vehicleId!)
          .order("recorded_at", { ascending: true })
          .limit(1000),
      ),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as Subscription | null;
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      unwrap<Invoice[]>(
        await supabase.from("invoices").select("*").order("issued_at", { ascending: false }),
      ),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integration_settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as Settings | null;
    },
  });
}

/** L'utilisateur connecté est-il administrateur de la plateforme ? */
export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw new Error(error.message);
      return Boolean(data);
    },
    staleTime: 60_000,
  });
}

/** Configuration système globale (Traccar / WhatsApp) — admin only. */
export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as SystemSettings | null;
    },
    refetchInterval: 15000,
  });
}

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  roles: string[] | null;
  vehicle_count: number | null;
  plan: string | null;
  status: string | null;
  created_at: string | null;
};

/** Liste de tous les utilisateurs de la plateforme — admin only. */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminUserRow[];
    },
  });
}

/** Tous les véhicules, toutes organisations confondues — admin only. */
export function useAdminVehicles() {
  return useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: async () =>
      unwrap<Vehicle[]>(
        await supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      ),
  });
}

/** Toutes les alertes, toutes organisations confondues — admin only. */
export function useAdminAlerts(limit = 200) {
  return useQuery({
    queryKey: ["admin-alerts", limit],
    queryFn: async () =>
      unwrap<Alert[]>(
        await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ),
  });
}

/** Toutes les géofences, toutes organisations confondues — admin only. */
export function useAdminGeofences() {
  return useQuery({
    queryKey: ["admin-geofences"],
    queryFn: async () =>
      unwrap<Geofence[]>(
        await supabase.from("geofences").select("*").order("created_at", { ascending: false }),
      ),
  });
}

/** Tous les abonnements — admin only. */
export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () =>
      unwrap<Subscription[]>(
        await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      ),
  });
}

/** Toutes les factures — admin only. */
export function useAdminInvoices() {
  return useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () =>
      unwrap<Invoice[]>(
        await supabase.from("invoices").select("*").order("issued_at", { ascending: false }),
      ),
  });
}

// =======================================================================
// Notifications (boîte de notifications interne, basée sur `alerts`)
// =======================================================================

/** Nombre de notifications non lues de l'utilisateur connecté. */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });
}

/** Les N notifications les plus récentes pour le panneau cloche. */
export function useRecentNotifications(limit = 8) {
  return useQuery({
    queryKey: ["notifications-recent", limit],
    queryFn: async () =>
      unwrap<Alert[]>(
        await supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ),
    refetchInterval: 30000,
  });
}

// =======================================================================
// Analyse IA (Ollama)
// =======================================================================

/** Historique des analyses IA pour un véhicule (ou la flotte si undefined). */
export function useAiInsights(vehicleId?: string) {
  return useQuery({
    queryKey: ["ai-insights", vehicleId ?? "fleet"],
    queryFn: async () => {
      let q = supabase
        .from("ai_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      q = vehicleId ? q.eq("vehicle_id", vehicleId) : q.is("vehicle_id", null);
      return unwrap<AiInsight[]>(await q);
    },
  });
}
