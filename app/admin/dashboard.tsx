import { Text, View, ScrollView, useWindowDimensions } from "react-native";
import { Card, Header, Icon } from "@/components/ui";
import { usePlatformStats } from "@/hooks/admin";
import { LineChart } from "@/components/charts/LineChart";
import { rupees } from "@/lib/format";
import dayjs from "dayjs";

export default function AdminDashboard() {
  const { data } = usePlatformStats();
  const { width } = useWindowDimensions();

  const restaurants = data?.restaurants ?? [];
  const users = data?.users ?? [];
  const orders = data?.recentOrders ?? [];

  const verified = restaurants.filter((r) => r.status === "verified").length;
  const pending = restaurants.filter((r) => r.status === "pending").length;
  const suspended = restaurants.filter((r) => r.status === "suspended").length;

  const customers = users.filter((u) => u.role === "customer").length;
  const owners = users.filter((u) => u.role === "owner").length;

  const todayGmv = orders.filter((o) => dayjs(o.created_at).isSame(dayjs(), "day")).reduce((s, o) => s + Number(o.total_amount), 0);

  const revenueByDay = Array.from({ length: 14 }).map((_, i) => {
    const d = dayjs().subtract(13 - i, "day");
    return orders.filter((o) => dayjs(o.created_at).isSame(d, "day")).reduce((s, o) => s + Number(o.total_amount), 0);
  });

  // Cities
  const cityCounts = new Map<string, number>();
  for (const r of restaurants) {
    const c = r.city ?? "Unknown";
    cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }

  const chartW = Math.min(width - 64, 720);

  return (
    <ScrollView className="flex-1 bg-dime-bg-grouped" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Header title="Platform Dashboard" />

      <View className="flex-row flex-wrap gap-3">
        <Kpi label="Restaurants" value={String(restaurants.length)} sub={`${verified} verified • ${pending} pending`} icon="building.2.fill" />
        <Kpi label="Users" value={String(users.length)} sub={`${customers} customers • ${owners} owners`} icon="person.fill" />
        <Kpi label="GMV today" value={rupees(todayGmv)} sub="Last 24h" icon="chart.line.uptrend.xyaxis" />
        <Kpi label="Pending" value={String(pending)} sub="Applications waiting" icon="clock.fill" />
      </View>

      <Card>
        <Card.Header title="Platform GMV — last 14 days" />
        <Card.Body>
          <LineChart data={revenueByDay} width={chartW} />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Cities" />
        <Card.Body className="gap-2">
          {Array.from(cityCounts.entries()).map(([city, count]) => (
            <View key={city} className="flex-row items-center gap-3">
              <Icon name="location.fill" size={14} color="#FC8019" />
              <Text className="flex-1 text-[14px] text-dime-ink">{city}</Text>
              <Text className="text-[14px] font-semibold text-dime-ink-2">{count} restaurants</Text>
            </View>
          ))}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Restaurant status" />
        <Card.Body>
          <Status label="Verified" value={verified} color="#22C55E" />
          <Status label="Pending" value={pending} color="#F59E0B" />
          <Status label="Suspended" value={suspended} color="#EF4444" />
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <View className="min-w-[150px] flex-1 rounded-2xl border border-dime-border bg-white p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <Icon name={icon} size={14} color="#FC8019" />
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">{label}</Text>
      </View>
      <Text className="text-[22px] font-semibold text-dime-ink">{value}</Text>
      {sub ? <Text className="mt-0.5 text-[11px] text-dime-ink-3">{sub}</Text> : null}
    </View>
  );
}

function Status({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="mt-2 flex-row items-center gap-3">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="flex-1 text-[14px] text-dime-ink-2">{label}</Text>
      <Text className="text-[14px] font-semibold text-dime-ink">{value}</Text>
    </View>
  );
}
