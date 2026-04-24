import { useMemo } from "react";
import { Text, View, useWindowDimensions, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Card, Header, Icon, Screen } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";

const PLATFORM_TAKE_RATE = 0.05; // 5% commission assumption — easy to change.

type OrderRow = Tables<"orders"> & { restaurants: { name: string | null; city: string | null } | null };

export default function Financials() {
  const { width } = useWindowDimensions();
  const chartW = Math.min(width - 64, 720);

  const { data: orders } = useQuery({
    queryKey: ["fin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name, city)")
        .gte("created_at", dayjs().subtract(90, "day").toISOString())
        .order("created_at");
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  const stats = useMemo(() => {
    const list = orders ?? [];
    const paid = list.filter((o) => o.status === "paid");
    const cancelled = list.filter((o) => o.status === "cancelled");
    const gmv = paid.reduce((s, o) => s + Number(o.total_amount), 0);
    const revenue = gmv * PLATFORM_TAKE_RATE;
    const refunds = cancelled.reduce((s, o) => s + Number(o.total_amount), 0);
    const aov = paid.length ? gmv / paid.length : 0;
    return { gmv, revenue, refunds, paid, list, aov };
  }, [orders]);

  // Daily series 30 days
  const series = useMemo(() => {
    const days = Array.from({ length: 30 }).map((_, i) => dayjs().subtract(29 - i, "day"));
    return days.map((d) => {
      const dayOrders = stats.list.filter((o) => dayjs(o.created_at).isSame(d, "day") && o.status === "paid");
      return dayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    });
  }, [stats.list]);

  // Monthly cohort (last 6 months)
  const monthly = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => dayjs().subtract(5 - i, "month").startOf("month"));
    return months.map((m) => {
      const ordersIn = stats.list.filter((o) => dayjs(o.created_at).isSame(m, "month") && o.status === "paid");
      const gmv = ordersIn.reduce((s, o) => s + Number(o.total_amount), 0);
      return { month: m.format("MMM"), gmv, count: ordersIn.length };
    });
  }, [stats.list]);

  // Per-restaurant
  const byRestaurant = useMemo(() => {
    const map = new Map<string, { name: string; city: string; gmv: number; count: number }>();
    for (const o of stats.paid) {
      const key = o.restaurant_id;
      const cur = map.get(key) ?? { name: o.restaurants?.name ?? "—", city: o.restaurants?.city ?? "", gmv: 0, count: 0 };
      cur.gmv += Number(o.total_amount);
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.gmv - a.gmv);
  }, [stats.paid]);

  // Per-city
  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of stats.paid) {
      const city = o.restaurants?.city ?? "Unknown";
      map.set(city, (map.get(city) ?? 0) + Number(o.total_amount));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [stats.paid]);

  return (
    <Screen>
      <Header title="Revenue & Financials" subtitle="90 days · take rate 5%" />

      <View className="mx-4 flex-row flex-wrap gap-3">
        <Kpi label="GMV" value={rupees(stats.gmv)} sub="Gross merch volume" tone="bg-dime-orange-500" />
        <Kpi label="Platform revenue" value={rupees(stats.revenue)} sub={`${(PLATFORM_TAKE_RATE * 100).toFixed(0)}% take`} tone="bg-emerald-500" />
        <Kpi label="Refunds" value={rupees(stats.refunds)} sub={`${stats.list.length - stats.paid.length} cancelled`} tone="bg-dime-danger" />
        <Kpi label="Avg order" value={rupees(stats.aov)} sub={`${stats.paid.length} paid orders`} tone="bg-blue-500" />
      </View>

      <Card className="mx-4 mt-4">
        <Card.Header title="GMV — last 30 days" />
        <Card.Body>
          <LineChart data={series} width={chartW} />
        </Card.Body>
      </Card>

      <View className="mx-4 mt-4 rounded-2xl border border-dime-border bg-white p-4">
        <Text className="text-[15px] font-semibold text-dime-ink">Monthly trend</Text>
        <View className="mt-3 flex-row items-end gap-2 h-[120px]">
          {monthly.map((m, i) => {
            const maxGmv = Math.max(...monthly.map((x) => x.gmv), 1);
            const heightPct = (m.gmv / maxGmv) * 100;
            return (
              <View key={i} className="flex-1 items-center">
                <View style={{ height: `${heightPct}%`, minHeight: 4 }} className="w-full bg-dime-orange-500 rounded-t-md" />
                <Text className="mt-1 text-[10px] text-dime-ink-3">{m.month}</Text>
                <Text className="text-[10px] font-semibold text-dime-ink">{rupees(m.gmv)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="mx-4 mt-4">
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">Top earners</Text>
        <View className="rounded-2xl border border-dime-border bg-white">
          {byRestaurant.slice(0, 10).map((r, idx) => (
            <View key={r.name + idx} className={`flex-row items-center gap-3 p-3 ${idx > 0 ? "border-t border-dime-border" : ""}`}>
              <Text className="w-6 text-[13px] font-bold text-dime-orange-600">#{idx + 1}</Text>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{r.name}</Text>
                <Text className="text-[11px] text-dime-ink-3">{r.city} · {r.count} orders</Text>
              </View>
              <Text className="text-[14px] font-semibold text-dime-ink">{rupees(r.gmv)}</Text>
            </View>
          ))}
          {byRestaurant.length === 0 ? <View className="p-4"><Text className="text-[12px] text-dime-ink-3">No orders yet.</Text></View> : null}
        </View>
      </View>

      <View className="mx-4 mt-4">
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">By city</Text>
        <View className="rounded-2xl border border-dime-border bg-white p-3 gap-2">
          {byCity.map(([city, gmv]) => {
            const pct = stats.gmv > 0 ? (gmv / stats.gmv) * 100 : 0;
            return (
              <View key={city}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-medium text-dime-ink">{city}</Text>
                  <Text className="text-[12px] text-dime-ink-2">{rupees(gmv)}  ·  {pct.toFixed(0)}%</Text>
                </View>
                <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-dime-bg-2">
                  <View style={{ width: `${pct}%` }} className="h-full bg-dime-orange-500" />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <View className={`min-w-[150px] flex-1 rounded-2xl ${tone} p-4`}>
      <Text className="text-[10px] font-bold uppercase tracking-widest text-white/90">{label}</Text>
      <Text className="mt-1 text-[20px] font-semibold text-white">{value}</Text>
      <Text className="text-[11px] text-white/80">{sub}</Text>
    </View>
  );
}
