export const PLANS = {
  starter: { label: "Starter", price: 15000, vehicles: 5 },
  business: { label: "Business", price: 45000, vehicles: 25 },
  entreprise: { label: "Entreprise", price: 120000, vehicles: 200 },
} as const;

export type PlanKey = keyof typeof PLANS;

export const SUPPORT_PHONE = "+2250507348685";
export const SUPPORT_WA = "2250507348685";

export function fcfa(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} FCFA`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export const VEHICLE_CATEGORIES = [
  { value: "car", label: "Voiture" },
  { value: "truck", label: "Camion" },
  { value: "van", label: "Utilitaire" },
  { value: "moto", label: "Moto" },
  { value: "bus", label: "Bus" },
  { value: "asset", label: "Équipement" },
];

export function statusLabel(status: string) {
  switch (status) {
    case "moving":
      return "En mouvement";
    case "idle":
      return "À l'arrêt";
    case "offline":
      return "Hors ligne";
    default:
      return status;
  }
}