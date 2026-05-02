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
  booking_request: "calendar.badge.plus",
  booking_confirmed: "checkmark.circle.fill",
  booking_rejected: "xmark.circle.fill",
  restaurant_approved: "checkmark.seal.fill",
  restaurant_rejected: "exclamationmark.triangle.fill",
  offer: "gift.fill",
  loyalty: "crown.fill",
  system: "info.circle",
};

const typeColor: Record<string, string> = {
  order_update: "#E23744",
  booking_confirmed: "#267E3E",
  booking_rejected: "#E23744",
  restaurant_approved: "#267E3E",
  restaurant_rejected: "#E23744",
  offer: "#DB7C38",
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
            <Text className="text-[13px] font-bold text-[#E23744]">Mark all read</Text>
          </Pressable>
        }
      />

      <View className="h-2 bg-[#F2F2F2]" />

      {(data ?? []).length === 0 ? (
        <EmptyState icon="bell.fill" title="No notifications" message="Updates about your orders, bookings and offers will appear here." />
      ) : (
        <View className="bg-white">
          {(data ?? []).map((n, idx) => {
            const accent = typeColor[n.type] ?? "#535665";
            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  const d = n.data as { order_id?: string; booking_id?: string } | null;
                  if (d?.order_id) router.push({ pathname: "/order/[id]", params: { id: d.order_id } });
                  else if (d?.booking_id) router.push({ pathname: "/booking/[id]", params: { id: d.booking_id } });
                }}
                className="flex-row gap-3.5 px-4 py-3.5"
                style={idx > 0 ? { borderTopWidth: 1, borderTopColor: "#F0F0F0" } : undefined}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: n.is_read ? "#F8F8F8" : `${accent}14` }}
                >
                  <Icon name={typeIcon[n.type] ?? "info.circle"} size={16} color={n.is_read ? "#93959F" : accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-[#1C1C1E]">{n.title}</Text>
                  <Text className="mt-0.5 text-[13px] text-[#535665]">{n.message}</Text>
                  <Text className="mt-1 text-[11px] text-[#93959F]">{timeAgo(n.created_at)}</Text>
                </View>
                {!n.is_read ? <View className="h-2 w-2 self-center rounded-full bg-[#E23744]" /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
