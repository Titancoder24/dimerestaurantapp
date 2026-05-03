import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Icon, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_ACCENT, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type Metric = "gmv" | "rating" | "orders" | "growth";
const metrics: { id: Metric; label: string }[] = [
  { id: "gmv", label: "By GMV" },
  { id: "rating", label: "By rating" },
  { id: "orders", label: "By volume" },
  { id: "growth", label: "By growth" },
];

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
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · GROWTH · BENCHMARKS"
        title="Tenant leaderboard"
        subtitle={`${ranked.length} verified · trailing 60 days`}
        rightSlot={<Pill tone="amber" icon="crown.fill">Top 10</Pill>}
      />

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {metrics.map((m) => {
          const active = m.id === metric;
          return (
            <Pressable
              key={m.id}
              onPress={() => { haptic.light(); setMetric(m.id); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, letterSpacing: -0.1 }}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Tenants ranked" subtitle={`Sorted by ${metrics.find((m) => m.id === metric)?.label.toLowerCase()}`} />
        {ranked.length === 0 ? (
          <EmptyState icon="crown.fill" title="No verified tenants yet" body="Once restaurants are verified and start taking paid orders, they rank here." compact />
        ) : null}
        {ranked.map((item, i) => {
          const medalBg = i === 0 ? "#2A2210" : i === 1 ? ADMIN_PANEL2 : i === 2 ? "#2B1810" : ADMIN_PANEL2;
          const medalColor = i === 0 ? ADMIN_AMBER : i === 1 ? ADMIN_INK2 : i === 2 ? ADMIN_ACCENT : ADMIN_INK3;
          return (
            <View
              key={item.restaurant.id}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 18, paddingVertical: 14,
                borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              }}
            >
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: medalBg, borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <MonoText size={13} weight="700" color={medalColor}>{String(i + 1).padStart(2, "0")}</MonoText>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.2 }}>{item.restaurant.name}</Text>
                <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 11.5, color: ADMIN_INK2 }}>
                  {item.restaurant.city ?? "—"} · {item.restaurant.cuisines.slice(0, 2).join(", ")}
                </Text>
                <View style={{ marginTop: 5, flexDirection: "row", gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 4,
                      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
                      backgroundColor: "#0E2F1F", borderWidth: 1, borderColor: "#1A5C3A",
                    }}
                  >
                    <Icon name="star.fill" size={9} color={ADMIN_GREEN} />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: ADMIN_GREEN, fontFamily: ADMIN_MONO }}>
                      {Number(item.restaurant.rating).toFixed(1)}
                    </Text>
                  </View>
                  <Pill>{item.orders} orders</Pill>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {metric === "gmv" ? <MonoText size={15} weight="700" color={ADMIN_INK}>{rupees(item.gmv)}</MonoText> : null}
                {metric === "rating" ? <MonoText size={15} weight="700" color={ADMIN_INK}>{Number(item.restaurant.rating).toFixed(2)} ★</MonoText> : null}
                {metric === "orders" ? <MonoText size={15} weight="700" color={ADMIN_INK}>{item.orders}</MonoText> : null}
                {metric === "growth" ? (
                  <MonoText size={15} weight="700" color={item.growth >= 0 ? ADMIN_GREEN : ADMIN_RED}>
                    {item.growth >= 0 ? "▲" : "▼"} {Math.abs(item.growth).toFixed(0)}%
                  </MonoText>
                ) : null}
                <MonoText size={10} color={ADMIN_INK3}>{metrics.find((m) => m.id === metric)?.label.replace("By ", "").toUpperCase()}</MonoText>
              </View>
            </View>
          );
        })}
      </CardShell>
    </PageScroll>
  );
}
