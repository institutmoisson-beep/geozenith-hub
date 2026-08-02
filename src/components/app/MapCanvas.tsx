import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type LeafletMapType from "./LeafletMap";

const LeafletMap = lazy(() => import("./LeafletMap"));

type Props = ComponentProps<typeof LeafletMapType>;

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "h-[520px] w-full animate-pulse rounded-xl border border-border bg-secondary/40"
      }
    />
  );
}

export function MapCanvas(props: Props) {
  return (
    <ClientOnly fallback={<Skeleton className={props.className} />}>
      <Suspense fallback={<Skeleton className={props.className} />}>
        <LeafletMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}