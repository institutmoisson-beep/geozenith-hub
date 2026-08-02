import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, CheckCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
  useRecentNotifications,
  useSettings,
  useUnreadNotificationsCount,
  type Alert,
} from "@/hooks/useMsnData";
import { playNotificationChime } from "@/lib/notification-sound";
import { formatDate } from "@/lib/msn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SEVERITY_DOT: Record<string, string> = {
  warning: "bg-destructive",
  info: "bg-primary",
};

export function NotificationBell() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { data: notifications = [] } = useRecentNotifications();
  const { data: settings } = useSettings();
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = settings?.sound_enabled ?? true;
  }, [settings?.sound_enabled]);

  // ---------------------------------------------------------------
  // Abonnement temps réel : dès qu'une notification arrive pour cet
  // utilisateur, on joue le son, on affiche un toast et on rafraîchit.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Alert;
          if (soundEnabledRef.current) playNotificationChime();
          toast(row.message, { description: formatDate(row.created_at) });
          qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
          qc.invalidateQueries({ queryKey: ["notifications-recent"] });
          qc.invalidateQueries({ queryKey: ["alerts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  async function markRead(id: string) {
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-recent"] });
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  async function markAllRead() {
    await supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-recent"] });
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-auto gap-1 px-2 py-1 text-xs"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Aucune notification
            </p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-2.5 border-b border-border/60 px-3 py-2.5 text-sm last:border-0 ${
                n.is_read ? "opacity-60" : "bg-primary/5"
              }`}
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[n.severity] ?? "bg-muted-foreground"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  aria-label="Marquer comme lu"
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border p-2">
          <Link to="/alerts">
            <Button variant="ghost" className="w-full text-xs">
              Voir toutes les notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
