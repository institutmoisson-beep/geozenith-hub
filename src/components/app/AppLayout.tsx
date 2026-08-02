import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BellRing,
  CarFront,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Radar,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useMsnData";
import logo from "@/assets/msn-tracker-logo.png";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/map", label: "Carte temps réel", icon: MapPinned },
  { to: "/fleet", label: "Flotte", icon: CarFront },
  { to: "/history", label: "Historique", icon: RouteIcon },
  { to: "/geofences", label: "Géofencing", icon: Radar },
  { to: "/alerts", label: "Alertes", icon: BellRing },
  { to: "/reports", label: "Rapports PDF", icon: FileText },
  { to: "/billing", label: "Facturation", icon: CreditCard },
  { to: "/settings", label: "Paramètres", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin } = useIsAdmin();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="MSN Tracker" className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block font-display text-base font-bold">MSN Tracker</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Institut Moisson
              </span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-brand text-primary-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm font-semibold transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-gradient-brand text-primary-foreground"
                  : "text-primary hover:bg-primary/20",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Administration
            </Link>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Fermer"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold">MSN Tracker</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
