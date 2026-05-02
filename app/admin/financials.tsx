import { useMemo } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Card } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";

const PLATFORM_TAKE_RATE = 0.05;

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

  const series = useMemo(() => {
    const days = Array.from({ length: 30 }).map((_, i) => dayjs().subtract(29 - i, "day"));
    return days.map((d) => {
      const dayOrders = stats.list.filter((o) => dayjs(o.created_at).isSame(d, "day") && o.status === "paid");
      return dayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    });
  }, [stats.list]);

  const monthly = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => dayjs().subtract(5 - i, "month").startOf("month"));
    return months.map((m) => {
      const ordersIn = stats.list.filter((o) => dayjs(o.created_at).isSame(m, "month") && o.status === "paid");
      const gmv = ordersIn.reduce((s, o) => s + Number(o.total_amount), 0);
      return { month: m.format("MMM"), gmv, count: ordersIn.length };
    });
  }, [stats.list]);

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

  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of stats.paid) {
      const city = o.restaurants?.city ?? "Unknown";
      map.set(city, (map.get(city) ?? 0) + Number(o.total_amount));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [stats.paid]);

  const kpis = [
    { label: "GMV", value: rupees(stats.gmv), sub: "Gross merch volume", bg: "#FFF7ED", color: "#EA580C" },
    { label: "Platform revenue", value: rupees(stats.revenue), sub: `${(PLATFORM_TAKE_RATE * 100).toFixed(0)}% take`, bg: "#F0FDF4", color: "#16A34A" },
    { label: "Refunds", value: rupees(stats.refunds), sub: `${stats.list.length - stats.paid.length} cancelled`, bg: "#FEF2F2", color: "#DC2626" },
    { label: "Avg order", value: rupees(stats.aov), sub: `${stats.paid.length} paid`, bg: "#EFF6FF", color: "#2563EB" },
  ];

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 40 }}>
      {/* Header */}
      <View>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Growth</Text>
        <Text className="mt-1 text-[26px] font-bold text-dime-ink" style={{ letterSpacing: -0.8 }}>Revenue & Financials</Text>
        <Text className="mt-0.5 text-[13px] text-dime-ink-4">90 days · take rate {(PLATFORM_TAKE_RATE * 100).toFixed(0)}%</Text>
      </View>

      {/* KPI row */}
      <View className="flex-row flex-wrap gap-4">
        {kpis.map((k) => (
          <View
            key={k.label}
            className="min-w-[160px] flex-1 rounded-2xl bg-white p-5"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
          >
            <View className="mb-2 h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: k.bg }}>
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: k.color }} />
            </View>
            <Text className="text-[12px] font-semibold text-dime-ink-3">{k.label}</Text>
            <Text className="mt-1 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{k.value}</Text>
            <Text className="mt-0.5 text-[11px] text-dime-ink-4">{k.sub}</Text>
          </View>
        ))}
      </View>

      {/* GMV chart */}
      <Card>
        <Card.Header title="GMV Trend" subtitle="Last 30 days" />
        <Card.Body>
          <LineChart data={series} width={chartW} />
        </Card.Body>
      </Card>

      {/* Monthly bars */}
      <Card>
        <Card.Header title="Monthly Trend" />
        <Card.Body>
          <View className="flex-row items-end gap-2" style={{ height: 120 }}>
            {monthly.map((m, i) => {
              const maxGmv = Math.max(...monthly.map((x) => x.gmv), 1);
              const heightPct = (m.gmv / maxGmv) * 100;
              return (
                <View key={i} className="flex-1 items-center">
                  <View style={{ height: `${heightPct}%`, minHeight: 4 }} className="w-full rounded-t-md bg-dime-primary-500" />
                  <Text className="mt-1.5 text-[10px] font-medium text-dime-ink-3">{m.month}</Text>
                  <Text className="text-[10px] font-bold text-dime-ink">{rupees(m.gmv)}</Text>
                </View>
              );
            })}
          </View>
        </Card.Body>
      </Card>

      {/* Top earners */}
      <Card>
        <Card.Header title="Top Earners" />
        <Card.Body className="gap-0">
          {byRestaurant.slice(0, 10).map((r, idx) => (
            <View key={r.name + idx} className={`flex-row items-center gap-3.5 py-3 ${idx > 0 ? "border-t border-neutral-100" : ""}`}>
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-dime-primary-50">
                <Text className="text-[11px] font-bold text-dime-primary-600">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{r.name}</Text>
                <Text className="text-[11px] text-dime-ink-4">{r.city} · {r.count} orders</Text>
              </View>
              <Text className="text-[14px] font-bold text-dime-ink">{rupees(r.gmv)}</Text>
            </View>
          ))}
          {byRestaurant.length === 0 ? <Text className="py-6 text-center text-[13px] text-dime-ink-4">No orders yet.</Text> : null}
        </Card.Body>
      </Card>

      {/* By city */}
      <Card>
        <Card.Header title="By City" />
        <Card.Body className="gap-3">
          {byCity.map(([city, gmv]) => {
            const pct = stats.gmv > 0 ? (gmv / stats.gmv) * 100 : 0;
            return (
              <View key={city}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-semibold text-dime-ink">{city}</Text>
                  <Text className="text-[12px] text-dime-ink-3">{rupees(gmv)} · {pct.toFixed(0)}%</Text>
                </View>
                <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <View style={{ width: `${pct}%` }} className="h-full rounded-full bg-dime-primary-500" />
                </View>
              </View>
            );
          })}
        </Card.Body>
      </Card>
    </ScrollView>
  );
}
