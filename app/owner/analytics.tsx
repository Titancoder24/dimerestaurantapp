import { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Header, Icon, Screen } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { useOwnedRestaurant, useRestaurantOrders, useTopItems } from "@/hooks/owner";
import { rupees } from "@/lib/format";
import dayjs from "dayjs";

export default function Analytics() {
  const { width } = useWindowDimensions();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: orders } = useRestaurantOrders(restaurant?.id);
  const { data: topItems } = useTopItems(restaurant?.id);

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

  const chartWidth = Math.min(width - 32, 720);

  return (
    <Screen>
      <Header title="Analytics" subtitle={restaurant?.name} />

      <View className="mx-5 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Revenue — last 14 days</Text>
          <Icon name="chart.line.uptrend.xyaxis" size={18} color="#FF6B2C" />
        </View>
        <LineChart data={revenueByDay.map((r) => r.total)} width={chartWidth} />
        <View className="flex-row justify-between px-4">
          <Text className="text-[11px] text-dime-ink-3">{revenueByDay[0]?.day.format("DD MMM")}</Text>
          <Text className="text-[11px] text-dime-ink-3">{revenueByDay.at(-1)?.day.format("DD MMM")}</Text>
        </View>
      </View>

      <View className="mx-5 mt-4 flex-row gap-4">
        <StatCard label="Dine-in" value={orderBreakdown.dine_in} color="#FF6B2C" />
        <StatCard label="Takeaway" value={orderBreakdown.takeaway} color="#22C55E" />
        <StatCard label="Delivery" value={orderBreakdown.delivery} color="#3B82F6" />
      </View>

      <View className="mx-5 mt-4 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Performance snapshot</Text>
        <Row label="Total orders" value={String(orders?.length ?? 0)} />
        <Row label="Total revenue" value={rupees((orders ?? []).reduce((s, o) => s + Number(o.total_amount), 0))} />
        <Row label="Average order" value={rupees(orders && orders.length > 0 ? (orders.reduce((s, o) => s + Number(o.total_amount), 0)) / orders.length : 0)} />
        <Row label="Rating" value={`${Number(restaurant?.rating ?? 0).toFixed(1)} / 5`} />
        <Row label="Reviews" value={String(restaurant?.review_count ?? 0)} />
      </View>

      <View className="mx-5 mt-4 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Top selling items</Text>
          <Icon name="flame.fill" size={18} color="#FF6B2C" />
        </View>
        {(topItems ?? []).length === 0 ? (
          <Text className="mt-4 text-center text-[13px] text-dime-ink-3">No order data yet</Text>
        ) : (
          (topItems ?? []).map((item, i) => (
            <View key={item.name} className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-dime-primary-50">
                  <Text className="text-[11px] font-bold text-dime-primary-700">#{i + 1}</Text>
                </View>
                <View>
                  <Text className="text-[13px] font-bold text-dime-ink">{item.name}</Text>
                  <Text className="text-[11px] text-dime-ink-3">{item.qty} sold</Text>
                </View>
              </View>
              <Text className="text-[14px] font-bold text-dime-ink">{rupees(item.revenue)}</Text>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
      <View className="h-2 w-8 rounded-full" style={{ backgroundColor: color }} />
      <Text className="mt-2 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{value}</Text>
      <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3 flex-row items-center justify-between">
      <Text className="text-[13px] text-dime-ink-2">{label}</Text>
      <Text className="text-[14px] font-bold text-dime-ink">{value}</Text>
    </View>
  );
}
