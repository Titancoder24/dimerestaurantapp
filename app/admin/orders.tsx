import { FlatList, Text, View } from "react-native";
import { Badge, Icon, Screen } from "@/components/ui";
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
    <Screen scroll={false} className="bg-neutral-50">
      <View className="bg-white px-6 pb-4 pt-5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }}>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Orders</Text>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Platform Orders</Text>
          <Text className="text-[13px] text-dime-ink-4">{data?.length ?? 0} most recent</Text>
        </View>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
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
              <Text className="mt-0.5 text-[12px] text-dime-ink-3">{o.restaurants?.name ?? "—"} · {timeAgo(o.created_at)}</Text>
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
