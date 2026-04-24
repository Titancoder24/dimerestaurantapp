import { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Header, Icon, Screen } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { useOwnedRestaurant, useRestaurantOrders } from "@/hooks/owner";
import { rupees } from "@/lib/format";
import dayjs from "dayjs";

export default function Analytics() {
  const { width } = useWindowDimensions();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: orders } = useRestaurantOrders(restaurant?.id);

  // Revenue over last 14 days
  const revenueByDay = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => dayjs().subtract(13 - i, "day"));
    return days.map((d) => {
      const total = (orders ?? [])
        .filter((o) => dayjs(o.created_at).isSame(d, "day"))
        .reduce((s, o) => s + Number(o.total_amount), 0);
      return { day: d, total };
    });
  }, [orders]);

  const orderBreakdown = useMemo(() => {
    const counts = { dine_in: 0, takeaway: 0, delivery: 0 };
    for (const o of orders ?? []) counts[o.type] += 1;
    return counts;
  }, [orders]);

  // Top items by revenue
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders ?? []) {
      // order_items aren't loaded here — for real we'd include them. Simplified: rank by order_number.
      // We'll keep totals by order type as an approximation since we don't join items.
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orders]);

  const chartWidth = Math.min(width - 32, 720);

  return (
    <Screen>
      <Header title="Analytics" subtitle={restaurant?.name} />

      <View className="mx-4 rounded-2xl border border-dime-border bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-semibold text-dime-ink">Revenue — last 14 days</Text>
          <Icon name="chart.line.uptrend.xyaxis" size={18} color="#FC8019" />
        </View>
        <LineChart data={revenueByDay.map((r) => r.total)} width={chartWidth} />
        <View className="flex-row justify-between px-4">
          <Text className="text-[11px] text-dime-ink-3">{revenueByDay[0]?.day.format("DD MMM")}</Text>
          <Text className="text-[11px] text-dime-ink-3">{revenueByDay.at(-1)?.day.format("DD MMM")}</Text>
        </View>
      </View>

      <View className="mx-4 mt-4 flex-row gap-3">
        <StatCard label="Dine-in" value={orderBreakdown.dine_in} color="#FC8019" />
        <StatCard label="Takeaway" value={orderBreakdown.takeaway} color="#22C55E" />
        <StatCard label="Delivery" value={orderBreakdown.delivery} color="#3B82F6" />
      </View>

      <View className="mx-4 mt-4 rounded-2xl border border-dime-border bg-white p-4">
        <Text className="text-[15px] font-semibold text-dime-ink">Performance snapshot</Text>
        <Row label="Total orders" value={String(orders?.length ?? 0)} />
        <Row label="Total revenue" value={rupees((orders ?? []).reduce((s, o) => s + Number(o.total_amount), 0))} />
        <Row label="Average order" value={rupees(orders && orders.length > 0 ? (orders.reduce((s, o) => s + Number(o.total_amount), 0)) / orders.length : 0)} />
        <Row label="Rating" value={`${Number(restaurant?.rating ?? 0).toFixed(1)} / 5`} />
        <Row label="Reviews" value={String(restaurant?.review_count ?? 0)} />
      </View>
    </Screen>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white border border-dime-border p-4">
      <View className="h-2 w-8 rounded-full" style={{ backgroundColor: color }} />
      <Text className="mt-2 text-[22px] font-semibold text-dime-ink">{value}</Text>
      <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3 flex-row items-center justify-between">
      <Text className="text-[13px] text-dime-ink-2">{label}</Text>
      <Text className="text-[14px] font-semibold text-dime-ink">{value}</Text>
    </View>
  );
}
