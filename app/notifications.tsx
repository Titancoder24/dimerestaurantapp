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
            <Text className="text-[13px] font-bold text-dime-primary-500">Mark all read</Text>
          </Pressable>
        }
      />

      {(data ?? []).length === 0 ? (
        <EmptyState icon="bell.fill" title="No notifications" message="Updates about your orders, bookings and offers will appear here." />
      ) : (
        <View className="px-5 py-2 gap-3">
          {(data ?? []).map((n) => (
            <Pressable
              key={n.id}
              onPress={() => {
                const data = n.data as { order_id?: string; booking_id?: string } | null;
                if (data?.order_id) router.push({ pathname: "/order/[id]", params: { id: data.order_id } });
                else if (data?.booking_id) router.push({ pathname: "/booking/[id]", params: { id: data.booking_id } });
              }}
              className={`flex-row gap-4 rounded-2xl p-4 ${n.is_read ? "bg-white" : "bg-dime-primary-50"}`}
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: n.is_read ? 0.03 : 0.06, shadowRadius: 8, elevation: 1 }}
            >
              <View className={`h-10 w-10 items-center justify-center rounded-xl ${n.is_read ? "bg-dime-bg-2" : "bg-dime-primary-500"}`}>
                <Icon name={typeIcon[n.type] ?? "info.circle"} size={16} color={n.is_read ? "#8A8A8A" : "#fff"} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-dime-ink">{n.title}</Text>
                <Text className="mt-0.5 text-[13px] text-dime-ink-2">{n.message}</Text>
                <Text className="mt-1.5 text-[11px] text-dime-ink-4">{timeAgo(n.created_at)}</Text>
              </View>
              {!n.is_read ? <View className="h-2.5 w-2.5 rounded-full bg-dime-primary-500 self-center" /> : null}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
