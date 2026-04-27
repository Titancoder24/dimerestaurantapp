import { FlatList, Text, View } from "react-native";
import { Badge, Header, Icon, Screen } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";

export default function AdminOrders() {
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as (Tables<"orders"> & { restaurants: { name: string } | null })[];
    },
  });

  return (
    <Screen scroll={false}>
      <Header title="Platform Orders" subtitle={`${data?.length ?? 0} most recent`} />
      <FlatList
        data={data ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: o }) => (
          <View className="flex-row items-center gap-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-primary-50">
              <Icon name="bag.fill" size={14} color="#FF6B2C" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-bold text-dime-ink">{o.order_number}</Text>
              <Text className="text-[11px] text-dime-ink-3">{o.restaurants?.name ?? "—"} • {timeAgo(o.created_at)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[13px] font-bold text-dime-ink">{rupees(o.total_amount)}</Text>
              <Badge tone={o.status === "paid" ? "gray" : o.status === "cancelled" ? "red" : "orange"} label={o.status} />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
