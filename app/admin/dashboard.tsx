import { Text, View, ScrollView, useWindowDimensions } from "react-native";
import { Card, Icon } from "@/components/ui";
import { usePlatformStats } from "@/hooks/admin";
import { LineChart } from "@/components/charts/LineChart";
import { rupees } from "@/lib/format";
import dayjs from "dayjs";

const kpiColors = [
  { bg: "#FFF7ED", icon: "#EA580C", border: "#FDBA74" },
  { bg: "#EFF6FF", icon: "#2563EB", border: "#93C5FD" },
  { bg: "#F0FDF4", icon: "#16A34A", border: "#86EFAC" },
  { bg: "#FEF3C7", icon: "#D97706", border: "#FCD34D" },
];

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

  const cityCounts = new Map<string, number>();
  for (const r of restaurants) {
    const c = r.city ?? "Unknown";
    cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
  }

  const chartW = Math.min(width - 64, 720);

  const kpis = [
    { label: "Restaurants", value: String(restaurants.length), sub: `${verified} verified · ${pending} pending`, icon: "building.2.fill" },
    { label: "Users", value: String(users.length), sub: `${customers} customers · ${owners} owners`, icon: "person.3.fill" },
    { label: "GMV today", value: rupees(todayGmv), sub: "Last 24h", icon: "chart.line.uptrend.xyaxis" },
    { label: "Pending", value: String(pending), sub: "Applications waiting", icon: "clock.fill" },
  ];

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerStyle={{ padding: 24, gap: 20 }}>
      {/* Page header */}
      <View>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Overview</Text>
        <Text className="mt-1 text-[26px] font-bold text-dime-ink" style={{ letterSpacing: -0.8 }}>Platform Dashboard</Text>
      </View>

      {/* KPI row */}
      <View className="flex-row flex-wrap gap-4">
        {kpis.map((k, idx) => {
          const c = kpiColors[idx % kpiColors.length]!;
          return (
            <View
              key={k.label}
              className="min-w-[160px] flex-1 rounded-2xl bg-white p-5"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
            >
              <View className="mb-3 flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: c.bg }}>
                  <Icon name={k.icon} size={15} color={c.icon} />
                </View>
                <Text className="text-[12px] font-semibold text-dime-ink-3">{k.label}</Text>
              </View>
              <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{k.value}</Text>
              {k.sub ? <Text className="mt-1 text-[11px] text-dime-ink-4">{k.sub}</Text> : null}
            </View>
          );
        })}
      </View>

      {/* GMV chart */}
      <Card>
        <Card.Header title="Platform GMV" subtitle="Last 14 days" />
        <Card.Body>
          <LineChart data={revenueByDay} width={chartW} />
        </Card.Body>
      </Card>

      {/* Bottom row: Cities + Status side by side on wide, stacked on narrow */}
      <View className={width >= 700 ? "flex-row gap-4" : "gap-4"}>
        <Card className="flex-1">
          <Card.Header title="Top Cities" />
          <Card.Body className="gap-3">
            {Array.from(cityCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([city, count], i) => (
                <View key={city} className="flex-row items-center gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-dime-primary-50">
                    <Text className="text-[11px] font-bold text-dime-primary-600">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-[14px] font-medium text-dime-ink">{city}</Text>
                  <View className="rounded-full bg-neutral-100 px-2.5 py-1">
                    <Text className="text-[12px] font-semibold text-dime-ink-2">{count}</Text>
                  </View>
                </View>
              ))}
          </Card.Body>
        </Card>

        <Card className="flex-1">
          <Card.Header title="Restaurant Status" />
          <Card.Body className="gap-3">
            <StatusRow label="Verified" value={verified} color="#22C55E" bg="#F0FDF4" />
            <StatusRow label="Pending" value={pending} color="#F59E0B" bg="#FFFBEB" />
            <StatusRow label="Suspended" value={suspended} color="#EF4444" bg="#FEF2F2" />
          </Card.Body>
        </Card>
      </View>
    </ScrollView>
  );
}

function StatusRow({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: bg }}>
        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      </View>
      <Text className="flex-1 text-[14px] font-medium text-dime-ink">{label}</Text>
      <Text className="text-[16px] font-bold text-dime-ink">{value}</Text>
    </View>
  );
}
