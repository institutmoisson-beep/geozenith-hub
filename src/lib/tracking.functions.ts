import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const syncTraccar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { fetchTraccar, knotsToKmh } = await import("./traccar.server");
    const { haversineKm } = await import("./msn");

    const { data: settings } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings?.traccar_url || !settings?.traccar_token) {
      throw new Error(
        "Configurez l'URL et le jeton Traccar dans Paramètres avant de lancer la synchronisation.",
      );
    }

    const { devices, positions } = await fetchTraccar(
      settings.traccar_url,
      settings.traccar_username ?? "",
      settings.traccar_token,
    );

    const { data: vehicles } = await supabase.from("vehicles").select("*").eq("user_id", userId);
    const { data: geofences } = await supabase
      .from("geofences")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    const byDevice = new Map((vehicles ?? []).map((v) => [String(v.traccar_device_id), v]));
    const speedLimit = settings.alert_speed_kmh ?? 90;
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
        user_id: userId,
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
          user_id: userId,
          vehicle_id: vehicle.id,
          type: "overspeed",
          severity: "warning",
          message: `${vehicle.name} roule à ${Math.round(speed)} km/h (limite ${speedLimit} km/h).`,
        });
      }

      for (const fence of geofences ?? []) {
        const distanceM =
          haversineKm(
            { lat: position.latitude, lng: position.longitude },
            { lat: fence.center_lat, lng: fence.center_lng },
          ) * 1000;
        const inside = distanceM <= fence.radius_m;
        if (inside && fence.trigger_type !== "exit") {
          alerts.push({
            user_id: userId,
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