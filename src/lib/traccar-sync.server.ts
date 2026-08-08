import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchTraccar, knotsToKmh } from "./traccar.server";
import { isInsideGeofence } from "./msn";

type Client = SupabaseClient<Database>;

export type SyncResult = {
  devices: number;
  updated: number;
  created: number;
  alerts: number;
};

/**
 * Logique de synchronisation Traccar partagée entre :
 *  - la fonction serveur `syncTraccar` (déclenchée par un admin connecté)
 *  - l'endpoint cron `/api/public/hooks/sync-traccar` (déclenché par pg_cron)
 *
 * `fallbackUserId` est utilisé pour les boîtiers détectés côté Traccar mais
 * pas encore rattachés à un véhicule ; ils restent « non assignés ».
 */
export async function runTraccarSync(
  supabase: Client,
  fallbackUserId: string | null,
): Promise<SyncResult> {
  const { data: settings } = await supabase.from("system_settings").select("*").maybeSingle();

  if (!settings?.traccar_url || !settings?.traccar_token) {
    throw new Error(
      "Configurez l'URL et le jeton Traccar depuis Administration → Configuration système avant de lancer la synchronisation.",
    );
  }

  const { devices, positions } = await fetchTraccar(
    settings.traccar_url,
    settings.traccar_username ?? "",
    settings.traccar_token,
  );

  const { data: vehicles } = await supabase.from("vehicles").select("*");
  const { data: geofences } = await supabase.from("geofences").select("*").eq("is_active", true);

  const byDevice = new Map((vehicles ?? []).map((v) => [String(v.traccar_device_id), v]));
  const speedLimit = settings.default_alert_speed_kmh ?? 90;
  let updated = 0;
  let created = 0;
  const alerts: Array<Record<string, unknown>> = [];

  for (const device of devices) {
    const position = positions.find((p) => p.deviceId === device.id);
    if (!position) continue;
    const speed = knotsToKmh(position.speed ?? 0);
    const status = device.status === "online" ? (speed > 3 ? "moving" : "idle") : "offline";
    let vehicle = byDevice.get(String(device.id)) ?? byDevice.get(device.uniqueId);

    if (!vehicle) {
      if (!fallbackUserId) continue;
      const { data: inserted } = await supabase
        .from("vehicles")
        .insert({
          user_id: fallbackUserId,
          name: device.name,
          plate: device.uniqueId,
          traccar_device_id: String(device.id),
          status,
          last_lat: position.latitude,
          last_lng: position.longitude,
          last_speed: speed,
          last_course: position.course ?? 0,
          last_update: position.fixTime ?? new Date().toISOString(),
          notes: "Non assigné — rattachez ce véhicule à un utilisateur depuis Administration.",
        })
        .select("*")
        .single();
      if (!inserted) continue;
      vehicle = inserted;
      created += 1;
    } else {
      await supabase
        .from("vehicles")
        .update({
          status,
          last_lat: position.latitude,
          last_lng: position.longitude,
          last_speed: speed,
          last_course: position.course ?? 0,
          last_update: position.fixTime ?? new Date().toISOString(),
        })
        .eq("id", vehicle.id);
      updated += 1;
    }

    await supabase.from("positions").insert({
      user_id: vehicle.user_id,
      vehicle_id: vehicle.id,
      lat: position.latitude,
      lng: position.longitude,
      speed,
      course: position.course ?? 0,
      address: position.address ?? null,
      recorded_at: position.fixTime ?? new Date().toISOString(),
    });

    if (speed > speedLimit) {
      alerts.push({
        user_id: vehicle.user_id,
        vehicle_id: vehicle.id,
        type: "overspeed",
        severity: "warning",
        message: `${vehicle.name} roule à ${Math.round(speed)} km/h (limite ${speedLimit} km/h).`,
      });
    }

    for (const fence of geofences ?? []) {
      if (fence.user_id !== vehicle.user_id) continue;
      const inside = isInsideGeofence({ lat: position.latitude, lng: position.longitude }, fence);
      if (inside && fence.trigger_type !== "exit") {
        alerts.push({
          user_id: vehicle.user_id,
          vehicle_id: vehicle.id,
          geofence_id: fence.id,
          type: "geofence_enter",
          severity: "info",
          message: `${vehicle.name} se trouve dans la zone « ${fence.name} ».`,
        });
      }
    }
  }

  if (alerts.length > 0) {
    await supabase.from("alerts").insert(alerts as never);

    // Notifications WhatsApp personnelles (best-effort, ne bloque jamais
    // la synchro si l'envoi échoue ou si WhatsApp n'est pas configuré).
    if (settings.whatsapp_enabled) {
      const { notifyUserWhatsApp } = await import("./whatsapp.server");
      await Promise.all(
        alerts.map((a) =>
          notifyUserWhatsApp(
            supabase,
            settings,
            a["user_id"] as string,
            `🚨 MSN Tracker\n${a["message"] as string}`,
          ),
        ),
      );
    }
  }

  return { devices: devices.length, updated, created, alerts: alerts.length };
}
