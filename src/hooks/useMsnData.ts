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
      let q = supabase.from("trips").select("*").order("started_at", { ascending: false }).limit(200);
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
      const { data, error } = await supabase
        .from("integration_settings")
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Settings | null;
    },
  });
}