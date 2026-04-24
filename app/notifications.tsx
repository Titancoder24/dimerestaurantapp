import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState, Header, Icon, Screen } from "@/components/ui";
import { useNotifications } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/store/auth";

const typeIcon: Record<string, string> = {
  order_update: "bag.fill",
  booking_update: "calendar",
  offer: "gift.fill",
  loyalty: "crown.fill",
  system: "info.circle",
};

export default function Notifications() {
  const router = useRouter();
  const { data } = useNotifications();
  const queryClient = useQueryClient();
  const profile = useAuth((s) => s.profile);

  useEffect(() => {
    if (!profile?.id) return;
    const ch = supabase
      .channel(`notif-${profile.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id, queryClient]);

  async function markAllRead() {
    if (!profile?.id) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Screen scroll={false}>
      <Header
        title="Notifications"
        back
        right={
          <Pressable onPress={markAllRead} hitSlop={10}>
            <Text className="text-[13px] font-semibold text-dime-orange-600">Mark all read</Text>
          </Pressable>
        }
      />

      {(data ?? []).length === 0 ? (
        <EmptyState icon="bell.fill" title="No notifications" message="Updates about your orders, bookings and offers will appear here." />
      ) : (
        <View className="px-4 py-2 gap-2">
          {(data ?? []).map((n) => (
            <Pressable
              key={n.id}
              onPress={() => {
                const data = n.data as { order_id?: string; booking_id?: string } | null;
                if (data?.order_id) router.push({ pathname: "/order/[id]", params: { id: data.order_id } });
                else if (data?.booking_id) router.push({ pathname: "/booking/[id]", params: { id: data.booking_id } });
              }}
              className={`flex-row gap-3 rounded-2xl border border-dime-border p-3 ${n.is_read ? "bg-white" : "bg-dime-orange-50"}`}
            >
              <View className={`h-9 w-9 items-center justify-center rounded-full ${n.is_read ? "bg-dime-bg-2" : "bg-dime-orange-500"}`}>
                <Icon name={typeIcon[n.type] ?? "info.circle"} size={16} color={n.is_read ? "#8E8E93" : "#fff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{n.title}</Text>
                <Text className="mt-0.5 text-[13px] text-dime-ink-2">{n.message}</Text>
                <Text className="mt-1 text-[11px] text-dime-ink-3">{timeAgo(n.created_at)}</Text>
              </View>
              {!n.is_read ? <View className="h-2 w-2 rounded-full bg-dime-orange-500 self-center" /> : null}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
