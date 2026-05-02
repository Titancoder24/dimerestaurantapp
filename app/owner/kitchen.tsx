import { useEffect, useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { Badge, Button, Icon, Screen, haptic } from "@/components/ui";
import { useOwnedRestaurant, useKdsOrders } from "@/hooks/owner";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

export default function Kitchen() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: orders, refetch } = useKdsOrders(restaurant?.id);
  const qc = useQueryClient();

  useEffect(() => {
    if (!restaurant?.id) return;
    const ch = supabase
      .channel(`kds-${restaurant.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => { refetch(); haptic.light(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurant?.id]);

  const grouped = useMemo(() => {
    const pending = (orders ?? []).filter((o) => o.status === "received");
    const preparing = (orders ?? []).filter((o) => o.status === "preparing");
    const ready = (orders ?? []).filter((o) => o.status === "ready");
    return { pending, preparing, ready };
  }, [orders]);

  async function advance(id: string, next: "preparing" | "ready") {
    await supabase.from("orders").update({ status: next }).eq("id", id);
    haptic.success();
    qc.invalidateQueries({ queryKey: ["kds-orders"] });
  }

  return (
    <Screen scroll={false} className="bg-neutral-50">
      <View className="bg-white px-6 pb-4 pt-5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }}>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Kitchen</Text>
        <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Kitchen Display</Text>
        <Text className="text-[12px] text-dime-ink-4">{restaurant?.name}</Text>

        <View className="mt-4 flex-row gap-3">
          <SummaryTile label="Pending" value={grouped.pending.length} bg="#FEF2F2" color="#DC2626" icon="exclamationmark.triangle.fill" />
          <SummaryTile label="Preparing" value={grouped.preparing.length} bg="#FFFBEB" color="#D97706" icon="flame.fill" />
          <SummaryTile label="Ready" value={grouped.ready.length} bg="#F0FDF4" color="#16A34A" icon="checkmark.circle.fill" />
        </View>
      </View>

      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.id}
        numColumns={1}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        renderItem={({ item: o }) => {
          const items = o.order_items ?? [];
          const target = 15;
          const elapsedMin = dayjs().diff(dayjs(o.created_at), "minute");
          const timerBg = elapsedMin >= target + 5 ? "#FEF2F2" : elapsedMin >= target ? "#FFFBEB" : "#F0FDF4";
          const timerColor = elapsedMin >= target + 5 ? "#DC2626" : elapsedMin >= target ? "#D97706" : "#16A34A";
          return (
            <View
              className="rounded-2xl bg-white p-5"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3.5">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-dime-primary-50">
                    <Text className="text-[14px] font-bold text-dime-primary-700">{o.table_id ? "T" : "TA"}</Text>
                  </View>
                  <View>
                    <Text className="text-[15px] font-bold text-dime-ink">{o.order_number}</Text>
                    <Text className="text-[12px] text-dime-ink-4">{dayjs(o.created_at).format("h:mm A")}</Text>
                  </View>
                </View>
                <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: timerBg }}>
                  <Text className="text-[12px] font-bold" style={{ color: timerColor }}>{elapsedMin}m</Text>
                </View>
              </View>
              <View className="mt-4 gap-1.5 border-t border-neutral-100 pt-4">
                {items.map((it) => (
                  <View key={it.id} className="flex-row items-start gap-2">
                    <Text className="w-7 text-[14px] font-bold text-dime-primary-600">{it.quantity}×</Text>
                    <View className="flex-1">
                      <Text className="text-[14px] font-medium text-dime-ink">{it.name}</Text>
                      {it.special_instructions ? (
                        <View className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1" style={{ borderWidth: 1, borderColor: "#FCD34D" }}>
                          <Text className="text-[11px] font-medium text-amber-800">{it.special_instructions}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
              <View className="mt-4 flex-row items-center justify-between border-t border-neutral-100 pt-4">
                <Badge tone={o.status === "received" ? "red" : o.status === "preparing" ? "yellow" : "green"} label={o.status} />
                {o.status === "received" ? (
                  <Button label="Start preparing" size="sm" onPress={() => advance(o.id, "preparing")} />
                ) : o.status === "preparing" ? (
                  <Button label="Mark ready" size="sm" onPress={() => advance(o.id, "ready")} />
                ) : (
                  <Text className="text-[12px] font-bold text-emerald-600">Waiting for pickup</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <Icon name="checkmark.circle.fill" size={24} color="#22C55E" />
            </View>
            <Text className="text-[15px] font-bold text-dime-ink">All clear</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-4">No orders in the kitchen right now.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function SummaryTile({ label, value, bg, color, icon }: { label: string; value: number; bg: string; color: string; icon: string }) {
  return (
    <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: bg }}>
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={11} color={color} />
        <Text className="text-[10px] font-bold uppercase" style={{ color, letterSpacing: 0.8 }}>{label}</Text>
      </View>
      <Text className="mt-1 text-[22px] font-bold" style={{ color, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
}
