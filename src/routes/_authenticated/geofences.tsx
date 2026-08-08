import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Circle, Hexagon, RotateCcw, Trash2, Undo2 } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { MapCanvas } from "@/components/app/MapCanvas";
import { useGeofences, useVehicles } from "@/hooks/useMsnData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/geofences")({
  head: () => ({
    meta: [
      { title: "Géofencing — MSN Tracker" },
      {
        name: "description",
        content:
          "Créez des zones circulaires ou polygonales et recevez une alerte à chaque entrée ou sortie.",
      },
      { property: "og:title", content: "Géofencing — MSN Tracker" },
      {
        property: "og:description",
        content:
          "Créez des zones circulaires ou polygonales et recevez une alerte à chaque entrée ou sortie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GeofencePage,
});

type Point = { lat: number; lng: number };

function GeofencePage() {
  const { data: geofences = [] } = useGeofences();
  const { data: vehicles = [] } = useVehicles();
  const qc = useQueryClient();

  const [shape, setShape] = useState<"circle" | "polygon">("circle");
  const [form, setForm] = useState({
    name: "",
    lat: "5.3599",
    lng: "-4.0083",
    radius: "500",
    trigger: "both",
  });
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

  function handleMapClick(lat: number, lng: number) {
    if (shape === "circle") {
      setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    } else {
      setPolygonPoints((pts) => [...pts, { lat, lng }]);
    }
  }

  function undoLastPoint() {
    setPolygonPoints((pts) => pts.slice(0, -1));
  }

  function resetPolygon() {
    setPolygonPoints([]);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();

    if (shape === "polygon") {
      if (polygonPoints.length < 3) {
        toast.error("Cliquez au moins 3 points sur la carte pour former un polygone.");
        return;
      }
      const { error } = await supabase.from("geofences").insert({
        user_id: auth.user!.id,
        name: form.name,
        shape_type: "polygon",
        points: polygonPoints,
        trigger_type: form.trigger,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Zone polygonale créée");
      setPolygonPoints([]);
    } else {
      const { error } = await supabase.from("geofences").insert({
        user_id: auth.user!.id,
        name: form.name,
        shape_type: "circle",
        center_lat: Number(form.lat),
        center_lng: Number(form.lng),
        radius_m: Number(form.radius),
        trigger_type: form.trigger,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Zone circulaire créée");
    }
    setForm((f) => ({ ...f, name: "" }));
    qc.invalidateQueries({ queryKey: ["geofences"] });
  }

  async function remove(id: string) {
    await supabase.from("geofences").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["geofences"] });
  }

  return (
    <div>
      <PageHeader
        title="Géofencing"
        description={
          shape === "circle"
            ? "Cliquez sur la carte pour définir le centre de la zone."
            : `Cliquez sur la carte pour placer les sommets du polygone (${polygonPoints.length} point(s), 3 minimum).`
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={shape}
              onValueChange={(v) => {
                setShape(v as "circle" | "polygon");
                setPolygonPoints([]);
              }}
              className="mb-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="circle" className="gap-1.5">
                  <Circle className="h-3.5 w-3.5" /> Cercle
                </TabsTrigger>
                <TabsTrigger value="polygon" className="gap-1.5">
                  <Hexagon className="h-3.5 w-3.5" /> Polygone
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="g-name">Nom</Label>
                <Input
                  id="g-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {shape === "circle" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="g-lat">Latitude</Label>
                      <Input
                        id="g-lat"
                        value={form.lat}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="g-lng">Longitude</Label>
                      <Input
                        id="g-lng"
                        value={form.lng}
                        onChange={(e) => setForm({ ...form, lng: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="g-rad">Rayon (m)</Label>
                    <Input
                      id="g-rad"
                      value={form.radius}
                      onChange={(e) => setForm({ ...form, radius: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{polygonPoints.length} point(s)</Badge>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={undoLastPoint}
                        disabled={polygonPoints.length === 0}
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Annuler
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={resetPolygon}
                        disabled={polygonPoints.length === 0}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Effacer
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur la carte pour ajouter des sommets. 3 points minimum.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="g-trig">Déclencheur</Label>
                <select
                  id="g-trig"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.trigger}
                  onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                >
                  <option value="both">Entrée et sortie</option>
                  <option value="enter">Entrée</option>
                  <option value="exit">Sortie</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Créer la zone
              </Button>
            </form>

            <div className="mt-5 space-y-2">
              {geofences.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    {g.shape_type === "polygon" ? (
                      <Hexagon className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.shape_type === "polygon"
                          ? `Polygone (${Array.isArray(g.points) ? g.points.length : 0} points)`
                          : `${g.radius_m ?? 0} m`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(g.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Carte des zones</CardTitle>
          </CardHeader>
          <CardContent>
            <MapCanvas
              vehicles={vehicles}
              geofences={geofences}
              draftPoints={shape === "polygon" ? polygonPoints : undefined}
              onMapClick={handleMapClick}
              className="h-[520px] w-full rounded-xl"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
