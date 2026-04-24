import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge, Card, Icon } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantOrders, useRestaurantBookings, useInventory } from "@/hooks/owner";
import { rupees, timeAgo } from "@/lib/format";
import dayjs from "dayjs";

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

  return (
    <ScrollView className="flex-1 bg-dime-bg-grouped" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-[13px] text-dime-ink-3">Welcome back</Text>
        <Text className="text-[24px] font-semibold text-dime-ink">{restaurant?.name}</Text>
      </View>

      {restaurant?.status === "pending" ? (
        <View className="flex-row items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-500">
            <Icon name="clock.fill" size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-amber-900">Awaiting approval</Text>
            <Text className="text-[12px] text-amber-800">Our team is reviewing your application. While you wait, you can build your menu, add tables, and upload photos.</Text>
          </View>
        </View>
      ) : restaurant?.status === "suspended" || restaurant?.status === "banned" ? (
        <View className="flex-row items-center gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-dime-danger">
            <Icon name="exclamationmark.triangle.fill" size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-red-900">Listing {restaurant.status}</Text>
            <Text className="text-[12px] text-red-800">Contact support@dime.app to resolve.</Text>
          </View>
        </View>
      ) : null}

      <View className="flex-row flex-wrap gap-3">
        <Kpi label="Orders today" value={String(todayOrders.length)} delta={todayOrders.length - ysdayOrders.length} icon="bag.fill" />
        <Kpi label="Revenue today" value={rupees(todayRevenue)} delta={revDelta} suffix="%" icon="chart.line.uptrend.xyaxis" />
        <Kpi label="Pending" value={String(pending.length)} icon="clock.fill" />
        <Kpi label="Bookings" value={String(bookings?.length ?? 0)} icon="calendar" />
      </View>

      <Card>
        <Card.Header title="Pending Orders" subtitle={`${pending.length} active in the kitchen`} />
        <Card.Body className="gap-2">
          {pending.slice(0, 5).map((o) => (
            <View key={o.id} className="flex-row items-center justify-between rounded-xl border border-dime-border bg-white p-3">
              <View>
                <Text className="text-[13px] font-semibold text-dime-ink">{o.order_number}</Text>
                <Text className="text-[11px] text-dime-ink-3">{timeAgo(o.created_at)} • {rupees(o.total_amount)}</Text>
              </View>
              <Badge tone={o.status === "received" ? "orange" : "blue"} label={o.status} />
            </View>
          ))}
          {pending.length === 0 ? <Text className="py-4 text-center text-[13px] text-dime-ink-3">Kitchen is clear — great!</Text> : null}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Low stock alerts" subtitle={`${lowStock.length} items need reorder`} />
        <Card.Body className="gap-2">
          {lowStock.slice(0, 5).map((i) => (
            <View key={i.id} className="flex-row items-center justify-between rounded-xl border border-dime-border bg-white p-3">
              <View className="flex-row items-center gap-2">
                <Icon name="exclamationmark.triangle.fill" size={14} color={i.quantity <= 0 ? "#EF4444" : "#F59E0B"} />
                <Text className="text-[14px] font-medium text-dime-ink">{i.name}</Text>
              </View>
              <Text className="text-[12px] text-dime-ink-2">{i.quantity} {i.unit} left</Text>
            </View>
          ))}
          {lowStock.length === 0 ? <Text className="py-4 text-center text-[13px] text-dime-ink-3">All stocked up.</Text> : null}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Today's bookings" subtitle={`${(bookings ?? []).filter((b) => dayjs(b.date).isSame(dayjs(), "day")).length} arrivals`} />
        <Card.Body className="gap-2">
          {(bookings ?? []).filter((b) => dayjs(b.date).isSame(dayjs(), "day")).slice(0, 5).map((b) => (
            <View key={b.id} className="flex-row items-center justify-between rounded-xl border border-dime-border bg-white p-3">
              <View>
                <Text className="text-[14px] font-semibold text-dime-ink">{b.users?.name ?? "Walk-in"}</Text>
                <Text className="text-[12px] text-dime-ink-3">{b.time} • {b.guests} guests • {b.seating_preference}</Text>
              </View>
              <Badge tone={b.status === "confirmed" ? "green" : "orange"} label={b.status} />
            </View>
          ))}
        </Card.Body>
      </Card>
    </ScrollView>
  );
}

function Kpi({ label, value, delta, suffix, icon }: { label: string; value: string; delta?: number; suffix?: string; icon: string }) {
  return (
    <View className="min-w-[150px] flex-1 rounded-2xl border border-dime-border bg-white p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <Icon name={icon} size={14} color="#FC8019" />
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">{label}</Text>
      </View>
      <Text className="text-[22px] font-semibold text-dime-ink">{value}</Text>
      {delta !== undefined ? (
        <Text className={`mt-1 text-[12px] ${delta >= 0 ? "text-emerald-600" : "text-dime-danger"}`}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}{suffix ?? ""} vs yesterday
        </Text>
      ) : null}
    </View>
  );
}
