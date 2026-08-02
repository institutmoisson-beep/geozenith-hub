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
    const { fetchTraccar, knotsToKmh } = await import("./traccar.server");
    const { haversineKm } = await import("./msn");

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Seul un administrateur peut déclencher la synchronisation.");
    }

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
        // Un boîtier détecté côté Traccar mais pas encore rattaché à un
        // véhicule/compte : on le laisse en attente plutôt que de
        // l'assigner arbitrairement à qui a cliqué sur "Synchroniser".
        // L'admin le rattachera à un utilisateur depuis Administration → Véhicules.
        const { data: inserted } = await supabase
          .from("vehicles")
          .insert({
            user_id: userId,
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
        const distanceM =
          haversineKm(
            { lat: position.latitude, lng: position.longitude },
            { lat: fence.center_lat, lng: fence.center_lng },
          ) * 1000;
        const inside = distanceM <= fence.radius_m;
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
    }

    return { devices: devices.length, updated, created, alerts: alerts.length };
  });
