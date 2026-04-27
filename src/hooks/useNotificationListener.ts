import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { haptic } from "@/components/ui";

/**
 * App-wide listener: subscribes to the user's notifications stream and
 * surfaces a toast whenever a new row arrives. Mounted once at the root.
 */
export function useNotificationListener(): void {
  const userId = useAuth((s) => s.profile?.id);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif-listen-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Tables<"notifications">;
          haptic.success();
          toast.push("info", n.title, n.message);
          qc.invalidateQueries({ queryKey: ["notifications"] });
          qc.invalidateQueries({ queryKey: ["unread-notif-count"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, toast]);
}

/**
 * Reactive unread notification count for the current user.
 */
export function useUnreadNotificationCount(): number {
  const userId = useAuth((s) => s.profile?.id);
  const { data } = useQuery({
    queryKey: ["unread-notif-count", userId],
    enabled: !!userId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
  return data ?? 0;
}
