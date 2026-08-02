import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { useVehicles } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VEHICLE_CATEGORIES, formatDate, statusLabel } from "@/lib/msn";

export const Route = createFileRoute("/_authenticated/fleet")({
  head: () => ({
    meta: [
      { title: "Gestion de flotte — MSN Tracker" },
      { name: "description", content: "Ajoutez et gérez vos véhicules et leurs boîtiers GPS." },
      { property: "og:title", content: "Gestion de flotte — MSN Tracker" },
      { property: "og:description", content: "Ajoutez et gérez vos véhicules et leurs boîtiers GPS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FleetPage,
});

function FleetPage() {
  const { data: vehicles = [] } = useVehicles();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", plate: "", category: "car", driver_name: "", traccar_device_id: "" });
  const [saving, setSaving] = useState(false);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("vehicles").insert({
      user_id: auth.user!.id,
      name: form.name,
      plate: form.plate || null,
      category: form.category,
      driver_name: form.driver_name || null,
      traccar_device_id: form.traccar_device_id || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Véhicule ajouté");
    setForm({ name: "", plate: "", category: "car", driver_name: "", traccar_device_id: "" });
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Véhicule supprimé");
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  }

  return (
    <div>
      <PageHeader title="Gestion de flotte" description="Vos véhicules, chauffeurs et boîtiers GPS Traccar." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Ajouter un véhicule</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addVehicle} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="v-name">Nom</Label>
                <Input id="v-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-plate">Immatriculation</Label>
                <Input id="v-plate" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-cat">Catégorie</Label>
                <select
                  id="v-cat"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {VEHICLE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-driver">Chauffeur</Label>
                <Input id="v-driver" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-dev">ID boîtier Traccar</Label>
                <Input id="v-dev" value={form.traccar_device_id} onChange={(e) => setForm({ ...form, traccar_device_id: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>Ajouter</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{vehicles.length} véhicule(s)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Vitesse</TableHead>
                  <TableHead>Dernier point</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.plate ?? "—"} · {v.driver_name ?? "sans chauffeur"}</p>
                    </TableCell>
                    <TableCell>{statusLabel(v.status)}</TableCell>
                    <TableCell>{Math.round(v.last_speed ?? 0)} km/h</TableCell>
                    <TableCell className="text-xs">{formatDate(v.last_update)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => remove(v.id)} aria-label="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {vehicles.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucun véhicule pour le moment.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
