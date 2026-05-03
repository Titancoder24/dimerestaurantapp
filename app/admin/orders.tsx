import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Icon, haptic } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";
import dayjs from "dayjs";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatRow, StatTile, Pill,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type StatusFilter = "all" | "paid" | "ready" | "preparing" | "placed" | "cancelled";
const filters: StatusFilter[] = ["all", "placed", "preparing", "ready", "paid", "cancelled"];

const statusTone: Record<string, "neutral" | "saffron" | "lilac" | "green" | "red" | "amber"> = {
  placed: "amber", preparing: "saffron", ready: "lilac", paid: "green", cancelled: "red", refunded: "red",
};

export default function AdminOrders() {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as (Tables<"orders"> & { restaurants: { name: string } | null })[];
    },
  });

  const list = data ?? [];
  const today = list.filter((o) => dayjs(o.created_at).isSame(dayjs(), "day"));
  const todayGmv = today.reduce((s, o) => s + Number(o.total_amount), 0);
  const paidCount = list.filter((o) => o.status === "paid").length;
  const cancelledCount = list.filter((o) => o.status === "cancelled").length;
  const avg = list.length > 0 ? list.reduce((s, o) => s + Number(o.total_amount), 0) / list.length : 0;

  const filtered = useMemo(() => filter === "all" ? list : list.filter((o) => o.status === filter), [list, filter]);

  return (
    <PageScroll>
      <PageHeader
        title="Platform orders"
        subtitle={`${list.length} most recent across the network · refresh updates the live feed`}
      />

      <StatRow>
        <StatTile icon="bag.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Today" value={String(today.length)} hint={`${rupees(todayGmv)} GMV`} />
        <StatTile icon="checkmark.circle.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Paid" value={String(paidCount)} hint="Completed orders" />
        <StatTile icon="xmark.circle.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="Cancelled" value={String(cancelledCount)} hint={`${list.length > 0 ? Math.round((cancelledCount / list.length) * 100) : 0}% of recent`} />
        <StatTile icon="indianrupeesign.circle.fill" iconBg="#1B1730" iconColor={ADMIN_ACCENT2} label="Avg ticket" value={rupees(avg)} hint="Across the window" />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const active = f === filter;
          const count = f === "all" ? list.length : list.filter((o) => o.status === f).length;
          return (
            <Pressable
              key={f}
              onPress={() => { haptic.light(); setFilter(f); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, textTransform: "capitalize" }}>{f}</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? ADMIN_BG : ADMIN_INK3, fontFamily: ADMIN_MONO }}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Order feed" subtitle={`${filtered.length} match`} />
        {filtered.length === 0 && !isLoading ? (
          <EmptyState icon="bag.fill" title="No orders here" body="Once orders hit the network, they'll show up live in this feed." compact />
        ) : null}
        {filtered.map((o, i) => (
          <View
            key={o.id}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View
              style={{
                width: 38, height: 38, borderRadius: 9,
                backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="bag.fill" size={15} color={ADMIN_ACCENT} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MonoText size={12} weight="700" color={ADMIN_INK}>{o.order_number}</MonoText>
                <Pill tone={statusTone[o.status] ?? "neutral"}>{o.status}</Pill>
              </View>
              <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 12.5, fontWeight: "600", color: ADMIN_INK2 }}>
                {o.restaurants?.name ?? "—"}
              </Text>
              <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(o.created_at).toUpperCase()}</MonoText>
            </View>
            <MonoText size={14} weight="700" color={ADMIN_INK}>{rupees(o.total_amount)}</MonoText>
          </View>
        ))}
      </CardShell>
    </PageScroll>
  );
}
