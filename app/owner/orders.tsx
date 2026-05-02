import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Badge, Chip, Input, Screen, Icon } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantOrders } from "@/hooks/owner";
import { rupees, timeAgo } from "@/lib/format";

const statusFilters = ["all", "received", "preparing", "ready", "served", "paid", "cancelled"] as const;

export default function OwnerOrders() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: orders } = useRestaurantOrders(restaurant?.id);
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");
  const [query, setQuery] = useState("");

  const filtered = (orders ?? []).filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (query && !o.order_number.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <Screen scroll={false} className="bg-neutral-50">
      <View className="bg-white px-6 pb-4 pt-5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }}>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Operations</Text>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Orders</Text>
          <Text className="text-[13px] text-dime-ink-4">{filtered.length} results</Text>
        </View>
        <View className="mt-3">
          <Input placeholder="Search order number..." value={query} onChangeText={setQuery} leading={<Icon name="magnifyingglass" size={15} color="#A3A3A3" />} />
        </View>
        <View className="mt-3">
          <FlatList
            horizontal
            data={statusFilters}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip label={item.replace("_", " ")} selected={filter === item} onPress={() => setFilter(item)} />
            )}
          />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        renderItem={({ item: o }) => (
          <View
            className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-dime-primary-50">
              <Icon name="bag.fill" size={15} color="#EA580C" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{o.order_number}</Text>
              <Text className="mt-0.5 text-[12px] text-dime-ink-3">{timeAgo(o.created_at)} · {o.type.replace("_", " ")}</Text>
            </View>
            <View className="items-end gap-1">
              <Text className="text-[14px] font-bold text-dime-ink">{rupees(o.total_amount)}</Text>
              <Badge tone={o.status === "paid" ? "gray" : o.status === "cancelled" ? "red" : "orange"} label={o.status} />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
