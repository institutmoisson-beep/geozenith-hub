type VehicleLike = { name: string; status: string; last_speed: number | null };
type TripLike = { distance_km: number; duration_min: number; max_speed: number };
type AlertLike = { type: string; severity: string; message: string };

export function buildFleetPrompt(
  vehicles: VehicleLike[],
  trips: TripLike[],
  alerts: AlertLike[],
) {
  const totalKm = trips.reduce((s, t) => s + (t.distance_km ?? 0), 0);
  const maxSpeed = trips.reduce((s, t) => Math.max(s, t.max_speed ?? 0), 0);
  return [
    "Tu es un analyste de flotte GPS. Réponds en français, en 200 mots maximum,",
    "sous forme de puces courtes : anomalies de conduite, usure estimée, recommandations concrètes.",
    "",
    `Véhicules (${vehicles.length}) :`,
    ...vehicles
      .slice(0, 40)
      .map((v) => `- ${v.name} · statut ${v.status} · ${Math.round(v.last_speed ?? 0)} km/h`),
    "",
    `Trajets récents : ${trips.length}, distance cumulée ${totalKm.toFixed(1)} km, vitesse max ${Math.round(maxSpeed)} km/h.`,
    "",
    `Alertes récentes (${alerts.length}) :`,
    ...alerts.slice(0, 30).map((a) => `- [${a.severity}] ${a.type} : ${a.message}`),
  ].join("\n");
}

export async function askOllama(baseUrl: string, model: string, prompt: string) {
  const root = baseUrl.replace(/\/+$/, "");
  const res = await fetch(`${root}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    throw new Error(`Ollama [${res.status}] : ${await res.text()}`);
  }
  const json = (await res.json()) as { response?: string };
  const content = (json.response ?? "").trim();
  if (!content) throw new Error("Réponse vide du serveur Ollama.");
  return content;
}
