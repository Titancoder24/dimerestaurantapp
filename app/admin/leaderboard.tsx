import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Badge, Chip, ChipRow, Header, Icon, Screen } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";

type Metric = "gmv" | "rating" | "orders" | "growth";

export default function Leaderboard() {
  const [metric, setMetric] = useState<Metric>("gmv");

  const { data: restaurants } = useQuery({
    queryKey: ["lb-restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("status", "verified");
      if (error) throw error;
      return data as Tables<"restaurants">[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["lb-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, restaurant_id, total_amount, created_at, status")
        .gte("created_at", dayjs().subtract(60, "day").toISOString());
      if (error) throw error;
      return data as Pick<Tables<"orders">, "id" | "restaurant_id" | "total_amount" | "created_at" | "status">[];
    },
  });

  const ranked = useMemo(() => {
    if (!restaurants) return [];
    const stats = new Map<string, { gmv: number; orders: number; gmv30: number; gmvPrev30: number }>();
    for (const o of orders ?? []) {
      if (o.status !== "paid") continue;
      const cur = stats.get(o.restaurant_id) ?? { gmv: 0, orders: 0, gmv30: 0, gmvPrev30: 0 };
      cur.gmv += Number(o.total_amount);
      cur.orders += 1;
      const days = dayjs().diff(dayjs(o.created_at), "day");
      if (days < 30) cur.gmv30 += Number(o.total_amount);
      else if (days < 60) cur.gmvPrev30 += Number(o.total_amount);
      stats.set(o.restaurant_id, cur);
    }
    const enriched = restaurants.map((r) => {
      const s = stats.get(r.id) ?? { gmv: 0, orders: 0, gmv30: 0, gmvPrev30: 0 };
      const growth = s.gmvPrev30 > 0 ? ((s.gmv30 - s.gmvPrev30) / s.gmvPrev30) * 100 : (s.gmv30 > 0 ? 100 : 0);
      return { restaurant: r, ...s, growth };
    });
    return enriched.sort((a, b) => {
      if (metric === "gmv") return b.gmv - a.gmv;
      if (metric === "rating") return Number(b.restaurant.rating) - Number(a.restaurant.rating);
      if (metric === "orders") return b.orders - a.orders;
      return b.growth - a.growth;
    });
  }, [restaurants, orders, metric]);

  return (
    <Screen scroll={false}>
      <Header title="Restaurant Leaderboard" subtitle={`${ranked.length} verified · 60-day window`} />

      <View className="px-5">
        <ChipRow>
          <Chip label="By GMV" selected={metric === "gmv"} onPress={() => setMetric("gmv")} />
          <Chip label="By rating" selected={metric === "rating"} onPress={() => setMetric("rating")} />
          <Chip label="By volume" selected={metric === "orders"} onPress={() => setMetric("orders")} />
          <Chip label="By growth" selected={metric === "growth"} onPress={() => setMetric("growth")} />
        </ChipRow>
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(r) => r.restaurant.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <View className="flex-row items-center gap-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View className={`h-10 w-10 items-center justify-center rounded-full ${index === 0 ? "bg-amber-100" : index === 1 ? "bg-gray-100" : index === 2 ? "bg-orange-100" : "bg-dime-bg-2"}`}>
              <Text className={`text-[14px] font-bold ${index < 3 ? "text-amber-700" : "text-dime-ink-2"}`}>{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-dime-ink">{item.restaurant.name}</Text>
              <Text className="text-[11px] text-dime-ink-3">
                {item.restaurant.city} · {item.restaurant.cuisines.slice(0, 2).join(", ")}
              </Text>
              <View className="mt-1 flex-row gap-1.5">
                <View className="flex-row items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5">
                  <Icon name="star.fill" size={10} color="#22C55E" />
                  <Text className="text-[10px] font-bold text-green-700">{Number(item.restaurant.rating).toFixed(1)}</Text>
                </View>
                <Badge tone="gray" label={`${item.orders} orders`} />
              </View>
            </View>
            <View className="items-end">
              {metric === "gmv" ? <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{rupees(item.gmv)}</Text> : null}
              {metric === "rating" ? <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{Number(item.restaurant.rating).toFixed(2)} ★</Text> : null}
              {metric === "orders" ? <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{item.orders}</Text> : null}
              {metric === "growth" ? (
                <Text className={`text-[15px] font-bold ${item.growth >= 0 ? "text-emerald-600" : "text-dime-danger"}`} style={{ letterSpacing: -0.5 }}>
                  {item.growth >= 0 ? "▲" : "▼"} {Math.abs(item.growth).toFixed(0)}%
                </Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="px-5 py-12 text-center text-[13px] text-dime-ink-3">No data.</Text>}
      />
    </Screen>
  );
}
