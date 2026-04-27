import { useEffect, useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Badge, Button, Header, Icon, Screen, haptic } from "@/components/ui";
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
    <Screen scroll={false}>
      <Header title="Kitchen Display" subtitle={restaurant?.name} />
      <View className="flex-row gap-2 px-5">
        <SummaryTile label="Pending" value={grouped.pending.length} color="bg-dime-danger" />
        <SummaryTile label="Preparing" value={grouped.preparing.length} color="bg-amber-500" />
        <SummaryTile label="Ready" value={grouped.ready.length} color="bg-emerald-500" />
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
          const tone = elapsedMin >= target + 5 ? "bg-dime-danger" : elapsedMin >= target ? "bg-amber-500" : "bg-emerald-500";
          return (
            <View className="rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-dime-primary-50">
                    <Text className="text-[14px] font-bold text-dime-primary-700">{o.table_id ? "T" : "TA"}</Text>
                  </View>
                  <View>
                    <Text className="text-[15px] font-bold text-dime-ink">{o.order_number}</Text>
                    <Text className="text-[12px] text-dime-ink-3">{dayjs(o.created_at).format("h:mm A")}</Text>
                  </View>
                </View>
                <View className={`rounded-full px-3 py-1 ${tone}`}>
                  <Text className="text-[12px] font-bold text-white">{elapsedMin}m</Text>
                </View>
              </View>
              <View className="mt-4 gap-1 border-t border-neutral-50 pt-4">
                {items.map((it) => (
                  <View key={it.id} className="flex-row items-start gap-2">
                    <Text className="w-7 text-[14px] font-bold text-dime-primary-600">{it.quantity}×</Text>
                    <View className="flex-1">
                      <Text className="text-[14px] font-medium text-dime-ink">{it.name}</Text>
                      {it.special_instructions ? (
                        <View className="mt-1 rounded-md bg-yellow-50 px-2 py-1">
                          <Text className="text-[11px] font-medium text-yellow-800">{it.special_instructions}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
              <View className="mt-4 flex-row items-center justify-between border-t border-neutral-50 pt-4">
                <Badge tone={o.status === "received" ? "red" : o.status === "preparing" ? "yellow" : "green"} label={o.status} />
                {o.status === "received" ? (
                  <Button label="Start preparing" size="sm" onPress={() => advance(o.id, "preparing")} />
                ) : o.status === "preparing" ? (
                  <Button label="Mark ready" size="sm" onPress={() => advance(o.id, "ready")} />
                ) : (
                  <Text className="text-[12px] text-emerald-600 font-bold">Waiting for pickup</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="checkmark.circle.fill" size={32} color="#22C55E" />
            <Text className="mt-3 text-[15px] font-bold text-dime-ink">All clear</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-3">No orders in the kitchen right now.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} px-3 py-3`}>
      <Text className="text-[28px] font-bold text-white">{value}</Text>
      <Text className="text-[11px] font-bold uppercase text-white/90" style={{ letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}
