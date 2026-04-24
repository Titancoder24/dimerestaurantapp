import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Badge, Chip, Header, Input, Screen, Icon } from "@/components/ui";
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
    <Screen scroll={false}>
      <Header title="Orders" subtitle={`${filtered.length} results`} />
      <View className="px-4">
        <Input placeholder="Search order number..." value={query} onChangeText={setQuery} leading={<Icon name="magnifyingglass" size={16} color="#8E8E93" />} />
      </View>
      <View className="mt-3 px-4">
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
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: o }) => (
          <View className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-dime-orange-50">
              <Icon name="bag.fill" size={16} color="#FC8019" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{o.order_number}</Text>
              <Text className="text-[11px] text-dime-ink-3">{timeAgo(o.created_at)} • {o.type.replace("_", " ")}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[14px] font-semibold text-dime-ink">{rupees(o.total_amount)}</Text>
              <Badge tone={o.status === "paid" ? "gray" : o.status === "cancelled" ? "red" : "orange"} label={o.status} />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
