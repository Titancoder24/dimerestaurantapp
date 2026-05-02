import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge, Card, Icon } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantOrders, useRestaurantBookings, useInventory } from "@/hooks/owner";
import { rupees, timeAgo } from "@/lib/format";
import dayjs from "dayjs";

const kpiConfig = [
  { icon: "bag.fill", bg: "#FFF7ED", color: "#EA580C" },
  { icon: "chart.line.uptrend.xyaxis", bg: "#F0FDF4", color: "#16A34A" },
  { icon: "clock.fill", bg: "#FEF3C7", color: "#D97706" },
  { icon: "calendar", bg: "#EFF6FF", color: "#2563EB" },
];

export default function OwnerDashboard() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: orders } = useRestaurantOrders(restaurant?.id);
  const { data: bookings } = useRestaurantBookings(restaurant?.id);
  const { data: inventory } = useInventory(restaurant?.id);

  const todayOrders = useMemo(
    () => (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs(), "day")),
    [orders]
  );
  const ysdayOrders = useMemo(
    () => (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs().subtract(1, "day"), "day")),
    [orders]
  );

  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const ysdayRevenue = ysdayOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const revDelta = ysdayRevenue === 0 ? 100 : Math.round(((todayRevenue - ysdayRevenue) / ysdayRevenue) * 100);

  const pending = (orders ?? []).filter((o) => o.status === "received" || o.status === "preparing");
  const lowStock = (inventory ?? []).filter((i) => i.quantity <= i.min_threshold);
  const todayBookings = (bookings ?? []).filter((b) => dayjs(b.date).isSame(dayjs(), "day"));

  const kpis = [
    { label: "Orders today", value: String(todayOrders.length), delta: todayOrders.length - ysdayOrders.length },
    { label: "Revenue today", value: rupees(todayRevenue), delta: revDelta, suffix: "%" },
    { label: "Pending", value: String(pending.length) },
    { label: "Bookings", value: String(bookings?.length ?? 0) },
  ];

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerStyle={{ padding: 24, gap: 20 }}>
      {/* Welcome */}
      <View>
        <Text className="text-[12px] font-medium text-dime-ink-3">Welcome back</Text>
        <Text className="text-[26px] font-bold text-dime-ink" style={{ letterSpacing: -0.8 }}>{restaurant?.name}</Text>
      </View>

      {/* Status banners */}
      {restaurant?.status === "pending" ? (
        <View className="flex-row items-center gap-4 rounded-2xl bg-amber-50 p-5" style={{ borderWidth: 1, borderColor: "#FCD34D" }}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
            <Icon name="clock.fill" size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-amber-900">Awaiting approval</Text>
            <Text className="mt-0.5 text-[12px] leading-[18px] text-amber-800">Our team is reviewing your application. While you wait, you can build your menu, add tables, and upload photos.</Text>
          </View>
        </View>
      ) : restaurant?.status === "suspended" || restaurant?.status === "banned" ? (
        <View className="flex-row items-center gap-4 rounded-2xl bg-red-50 p-5" style={{ borderWidth: 1, borderColor: "#FCA5A5" }}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-500">
            <Icon name="exclamationmark.triangle.fill" size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-red-900">Listing {restaurant.status}</Text>
            <Text className="mt-0.5 text-[12px] text-red-800">Contact support@dime.app to resolve.</Text>
          </View>
        </View>
      ) : null}

      {/* KPI cards */}
      <View className="flex-row flex-wrap gap-4">
        {kpis.map((k, idx) => {
          const c = kpiConfig[idx]!;
          return (
            <View
              key={k.label}
              className="min-w-[160px] flex-1 rounded-2xl bg-white p-5"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
            >
              <View className="mb-3 flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: c.bg }}>
                  <Icon name={c.icon} size={15} color={c.color} />
                </View>
                <Text className="text-[12px] font-semibold text-dime-ink-3">{k.label}</Text>
              </View>
              <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{k.value}</Text>
              {k.delta !== undefined ? (
                <Text className={`mt-1 text-[12px] font-medium ${k.delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {k.delta >= 0 ? "↑" : "↓"} {Math.abs(k.delta)}{k.suffix ?? ""} vs yesterday
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Pending orders */}
      <Card>
        <Card.Header title="Pending Orders" subtitle={`${pending.length} active`} />
        <Card.Body className="gap-2">
          {pending.slice(0, 5).map((o) => (
            <View key={o.id} className="flex-row items-center justify-between rounded-xl bg-neutral-50 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-dime-primary-50">
                  <Icon name="bag.fill" size={14} color="#EA580C" />
                </View>
                <View>
                  <Text className="text-[14px] font-semibold text-dime-ink">{o.order_number}</Text>
                  <Text className="text-[11px] text-dime-ink-4">{timeAgo(o.created_at)} · {rupees(o.total_amount)}</Text>
                </View>
              </View>
              <Badge tone={o.status === "received" ? "orange" : "blue"} label={o.status} />
            </View>
          ))}
          {pending.length === 0 ? <Text className="py-6 text-center text-[13px] text-dime-ink-4">Kitchen is clear — great!</Text> : null}
        </Card.Body>
      </Card>

      {/* Low stock */}
      <Card>
        <Card.Header title="Low Stock Alerts" subtitle={`${lowStock.length} items`} />
        <Card.Body className="gap-2">
          {lowStock.slice(0, 5).map((i) => (
            <View key={i.id} className="flex-row items-center justify-between rounded-xl bg-neutral-50 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: i.quantity <= 0 ? "#FEF2F2" : "#FFFBEB" }}>
                  <Icon name="exclamationmark.triangle.fill" size={14} color={i.quantity <= 0 ? "#EF4444" : "#F59E0B"} />
                </View>
                <Text className="text-[14px] font-semibold text-dime-ink">{i.name}</Text>
              </View>
              <View className="rounded-full bg-neutral-100 px-2.5 py-1">
                <Text className="text-[12px] font-semibold text-dime-ink-2">{i.quantity} {i.unit}</Text>
              </View>
            </View>
          ))}
          {lowStock.length === 0 ? <Text className="py-6 text-center text-[13px] text-dime-ink-4">All stocked up.</Text> : null}
        </Card.Body>
      </Card>

      {/* Today's bookings */}
      <Card>
        <Card.Header title="Today's Bookings" subtitle={`${todayBookings.length} arrivals`} />
        <Card.Body className="gap-2">
          {todayBookings.slice(0, 5).map((b) => (
            <View key={b.id} className="flex-row items-center justify-between rounded-xl bg-neutral-50 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Icon name="calendar" size={14} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-[14px] font-semibold text-dime-ink">{b.users?.name ?? "Walk-in"}</Text>
                  <Text className="text-[11px] text-dime-ink-4">{b.time} · {b.guests} guests · {b.seating_preference}</Text>
                </View>
              </View>
              <Badge tone={b.status === "confirmed" ? "green" : "orange"} label={b.status} />
            </View>
          ))}
          {todayBookings.length === 0 ? <Text className="py-6 text-center text-[13px] text-dime-ink-4">No bookings today.</Text> : null}
        </Card.Body>
      </Card>
    </ScrollView>
  );
}
