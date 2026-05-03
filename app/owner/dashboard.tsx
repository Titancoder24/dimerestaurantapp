import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantOrders, useRestaurantBookings, useInventory } from "@/hooks/owner";
import { rupees, timeAgo } from "@/lib/format";
import dayjs from "dayjs";

const PAGE_BG = "#FAFAFA";
const CARD_BG = "#FFFFFF";
const HAIRLINE = "#ECECEC";
const INK = "#0E0E0C";
const INK2 = "#3F3D38";
const MUTED = "#8B8780";
const ACCENT = "#6F5BFF";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const DISP = '"Fraunces", Georgia, serif';

export default function OwnerDashboard() {
  const router = useRouter();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: orders } = useRestaurantOrders(restaurant?.id);
  const { data: bookings } = useRestaurantBookings(restaurant?.id);
  const { data: inventory } = useInventory(restaurant?.id);

  const today = useMemo(
    () => (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs(), "day")),
    [orders]
  );
  const yesterday = useMemo(
    () => (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs().subtract(1, "day"), "day")),
    [orders]
  );

  const todayRevenue = today.reduce((s, o) => s + Number(o.total_amount), 0);
  const ysdayRevenue = yesterday.reduce((s, o) => s + Number(o.total_amount), 0);
  const revDelta = ysdayRevenue === 0 ? 100 : Math.round(((todayRevenue - ysdayRevenue) / ysdayRevenue) * 100);

  const pending = (orders ?? []).filter((o) => o.status === "received" || o.status === "preparing");
  const lowStock = (inventory ?? []).filter((i) => i.quantity <= i.min_threshold);
  const todayBookings = (bookings ?? []).filter((b) => dayjs(b.date).isSame(dayjs(), "day"));

  const kpis = [
    { label: "Revenue today", value: rupees(todayRevenue), delta: revDelta, suffix: "%", positive: revDelta >= 0 },
    { label: "Orders", value: String(today.length), delta: today.length - yesterday.length, positive: today.length >= yesterday.length },
    { label: "In kitchen", value: String(pending.length) },
    { label: "Bookings", value: String(bookings?.length ?? 0) },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={{ padding: 32, gap: 24, maxWidth: 1100 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: "600", color: MUTED, letterSpacing: 0.2, fontFamily: MONO }}>
            {dayjs().format("dddd · DD MMM")}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 28, fontWeight: "700", color: INK, letterSpacing: -0.8, fontFamily: DISP }}>
            {restaurant?.name ?? "Workspace"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/owner/orders" as never)}
            style={{
              height: 32, paddingHorizontal: 12, borderRadius: 7,
              backgroundColor: "#fff", borderWidth: 1, borderColor: HAIRLINE,
              flexDirection: "row", alignItems: "center", gap: 6,
            }}
          >
            <Icon name="bag.fill" size={12} color={INK} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: INK, letterSpacing: -0.1 }}>Orders</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/owner/dineout" as never)}
            style={{
              height: 32, paddingHorizontal: 12, borderRadius: 7,
              backgroundColor: INK,
              flexDirection: "row", alignItems: "center", gap: 6,
            }}
          >
            <Icon name="sparkles" size={12} color="#fff" />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff", letterSpacing: -0.1 }}>Edit content</Text>
          </Pressable>
        </View>
      </View>

      {/* Status banner */}
      {restaurant?.status === "pending" ? (
        <View
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: "#FFFBEB", borderRadius: 10, padding: 14,
            borderWidth: 1, borderColor: "#FCE3A3",
          }}
        >
          <View
            style={{
              width: 8, height: 8, borderRadius: 4, backgroundColor: "#D97706",
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#7A4F00", letterSpacing: -0.1 }}>
              Pending verification
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: "#8E5F08" }}>
              You can build your menu and add tables while we review your application.
            </Text>
          </View>
        </View>
      ) : null}

      {/* KPI row — Linear/Stripe style monochrome with monospaced numerals */}
      <View
        style={{
          backgroundColor: CARD_BG, borderRadius: 12,
          borderWidth: 1, borderColor: HAIRLINE, overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {kpis.map((k, idx) => (
          <View
            key={k.label}
            style={{
              flex: 1, padding: 18,
              borderLeftWidth: idx > 0 ? 1 : 0, borderLeftColor: HAIRLINE,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "500", color: MUTED, letterSpacing: 0.2 }}>
              {k.label}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 26, fontWeight: "700", color: INK,
                letterSpacing: -0.8, fontFamily: MONO,
              }}
            >
              {k.value}
            </Text>
            {k.delta !== undefined ? (
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
                    backgroundColor: k.positive ? "#E6F4ED" : "#FCEAE6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10, fontWeight: "700",
                      color: k.positive ? "#0F8A4F" : "#D43A2F",
                      fontFamily: MONO,
                    }}
                  >
                    {k.positive ? "↑" : "↓"} {Math.abs(k.delta)}{k.suffix ?? ""}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: MUTED }}>vs yesterday</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* Two column layout */}
      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        {/* Pending orders */}
        <SectionCard
          title="Live orders"
          subtitle={`${pending.length} in kitchen`}
          actionLabel="View all"
          onAction={() => router.push("/owner/kitchen" as never)}
        >
          {pending.slice(0, 5).map((o) => (
            <Row
              key={o.id}
              icon="bag.fill"
              iconBg="#FFF7ED"
              iconColor="#EA580C"
              title={o.order_number}
              meta={`${timeAgo(o.created_at)} · ${rupees(o.total_amount)}`}
              status={o.status}
              statusColor={o.status === "received" ? "#D97706" : "#3358D4"}
            />
          ))}
          {pending.length === 0 ? <EmptyRow text="Kitchen is clear." /> : null}
        </SectionCard>

        {/* Today's bookings */}
        <SectionCard
          title="Today's bookings"
          subtitle={`${todayBookings.length} arrivals`}
          actionLabel="Manage"
          onAction={() => router.push("/owner/bookings" as never)}
        >
          {todayBookings.slice(0, 5).map((b) => (
            <Row
              key={b.id}
              icon="calendar"
              iconBg="#EEEAF6"
              iconColor={ACCENT}
              title={b.users?.name ?? "Walk-in"}
              meta={`${b.time} · ${b.guests} guests · ${b.seating_preference}`}
              status={b.status}
              statusColor={b.status === "confirmed" ? "#0F8A4F" : "#D97706"}
            />
          ))}
          {todayBookings.length === 0 ? <EmptyRow text="No bookings today." /> : null}
        </SectionCard>
      </View>

      {/* Low stock */}
      <SectionCard
        title="Inventory alerts"
        subtitle={`${lowStock.length} ${lowStock.length === 1 ? "item" : "items"} low`}
        actionLabel="Open inventory"
        onAction={() => router.push("/owner/inventory" as never)}
      >
        {lowStock.slice(0, 5).map((i) => (
          <Row
            key={i.id}
            icon="exclamationmark.triangle.fill"
            iconBg={i.quantity <= 0 ? "#FCEAE6" : "#FFFBEB"}
            iconColor={i.quantity <= 0 ? "#D43A2F" : "#D97706"}
            title={i.name}
            meta={`${i.quantity} ${i.unit} · threshold ${i.min_threshold} ${i.unit}`}
          />
        ))}
        {lowStock.length === 0 ? <EmptyRow text="All stocked up." /> : null}
      </SectionCard>

      {/* Footer marker */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8 }}>
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#0F8A4F" }} />
        <Text style={{ fontSize: 11, color: MUTED, fontFamily: MONO }}>
          Live · syncing with Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        flex: 1, minWidth: 320,
        backgroundColor: CARD_BG, borderRadius: 12,
        borderWidth: 1, borderColor: HAIRLINE,
      }}
    >
      <View
        style={{
          paddingHorizontal: 18, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: HAIRLINE,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: INK, letterSpacing: -0.2 }}>
            {title}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: MUTED, letterSpacing: 0.1 }}>
            {subtitle}
          </Text>
        </View>
        {actionLabel ? (
          <Pressable onPress={onAction} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: ACCENT, letterSpacing: -0.1 }}>
              {actionLabel}
            </Text>
            <Icon name="arrow.right" size={11} color={ACCENT} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ padding: 8, gap: 2 }}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  iconBg,
  iconColor,
  title,
  meta,
  status,
  statusColor,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  meta: string;
  status?: string;
  statusColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8,
      }}
    >
      <View
        style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: iconBg,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={icon} size={14} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: INK, letterSpacing: -0.1 }}>
          {title}
        </Text>
        <Text style={{ marginTop: 1, fontSize: 11.5, color: MUTED, fontFamily: MONO }}>
          {meta}
        </Text>
      </View>
      {status ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusColor ?? MUTED }} />
          <Text style={{ fontSize: 11, fontWeight: "600", color: INK2, textTransform: "capitalize", letterSpacing: -0.05 }}>
            {status.replace("_", " ")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={{ paddingVertical: 24, alignItems: "center" }}>
      <Text style={{ fontSize: 12, color: MUTED, letterSpacing: -0.05 }}>{text}</Text>
    </View>
  );
}
