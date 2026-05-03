import { useMemo } from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatRow, StatTile, Pill,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL2, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED,
} from "@/components/admin/shell";

const PLATFORM_TAKE_RATE = 0.05;

type OrderRow = Tables<"orders"> & { restaurants: { name: string | null; city: string | null } | null };

export default function Financials() {
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
      return { day: d.format("DD"), v: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0) };
    });
  }, [stats.list]);
  const seriesPeak = Math.max(1, ...series.map((s) => s.v));

  const monthly = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => dayjs().subtract(5 - i, "month").startOf("month"));
    return months.map((m) => {
      const ordersIn = stats.list.filter((o) => dayjs(o.created_at).isSame(m, "month") && o.status === "paid");
      const gmv = ordersIn.reduce((s, o) => s + Number(o.total_amount), 0);
      return { month: m.format("MMM"), gmv, count: ordersIn.length };
    });
  }, [stats.list]);
  const monthlyPeak = Math.max(1, ...monthly.map((m) => m.gmv));

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

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · GROWTH · FINANCE"
        title="Revenue & financials"
        subtitle={`Trailing 90 days · ${(PLATFORM_TAKE_RATE * 100).toFixed(0)}% platform take rate`}
        rightSlot={<Pill tone="lilac" icon="chart.line.uptrend.xyaxis">90 days</Pill>}
      />

      <StatRow>
        <StatTile icon="indianrupeesign.circle.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="GMV" value={rupees(stats.gmv)} hint="Gross merchandise value" />
        <StatTile icon="checkmark.seal.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Platform revenue" value={rupees(stats.revenue)} hint={`${(PLATFORM_TAKE_RATE * 100).toFixed(0)}% take across paid`} />
        <StatTile icon="arrow.uturn.backward.circle.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="Refunds & cancels" value={rupees(stats.refunds)} hint={`${stats.list.length - stats.paid.length} cancelled`} />
        <StatTile icon="bag.fill" iconBg="#1B1730" iconColor={ADMIN_ACCENT2} label="Avg ticket" value={rupees(stats.aov)} hint={`${stats.paid.length} paid orders`} />
      </StatRow>

      <CardShell>
        <CardHeader title="GMV — last 30 days" subtitle="Daily totals across paid orders" />
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 140 }}>
            {series.map((s, i) => {
              const h = Math.max(2, (s.v / seriesPeak) * 130);
              const isPeak = s.v === seriesPeak && seriesPeak > 0;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1, height: h, borderRadius: 3,
                    backgroundColor: isPeak ? ADMIN_ACCENT : ADMIN_HAIRLINE2,
                  }}
                />
              );
            })}
          </View>
        </View>
        {stats.list.length === 0 ? (
          <EmptyState icon="chart.line.uptrend.xyaxis" title="No paid orders yet" body="Once paid orders flow through, daily GMV will graph here." compact />
        ) : null}
      </CardShell>

      <CardShell>
        <CardHeader title="Monthly trend" subtitle="Last 6 months · paid orders only" />
        <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16, height: 160 }}>
            {monthly.map((m, i) => {
              const h = Math.max(4, (m.gmv / monthlyPeak) * 130);
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: "100%", height: h, borderRadius: 6,
                      backgroundColor: i === monthly.length - 1 ? ADMIN_ACCENT : ADMIN_PANEL2,
                      borderWidth: 1, borderColor: i === monthly.length - 1 ? ADMIN_ACCENT : ADMIN_HAIRLINE2,
                    }}
                  />
                  <MonoText size={10.5} color={ADMIN_INK3}>{m.month.toUpperCase()}</MonoText>
                  <MonoText size={11} weight="700" color={ADMIN_INK}>{rupees(m.gmv)}</MonoText>
                </View>
              );
            })}
          </View>
        </View>
      </CardShell>

      <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 320 }}>
          <CardShell>
            <CardHeader title="Top earners" subtitle="By GMV" right={<Pill tone="green">{byRestaurant.length}</Pill>} />
            {byRestaurant.length === 0 ? (
              <EmptyState icon="building.2.fill" title="No earners yet" body="When restaurants take paid orders, the leaderboard fills in." compact />
            ) : null}
            {byRestaurant.slice(0, 10).map((r, i) => (
              <View
                key={r.name + i}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  paddingHorizontal: 18, paddingVertical: 12,
                  borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
                }}
              >
                <View
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <MonoText size={11} weight="700" color={i < 3 ? ADMIN_ACCENT : ADMIN_INK}>
                    {String(i + 1).padStart(2, "0")}
                  </MonoText>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: ADMIN_INK }}>{r.name}</Text>
                  <MonoText size={10.5} color={ADMIN_INK3}>{(r.city || "—").toUpperCase()} · {r.count} ORDERS</MonoText>
                </View>
                <MonoText size={13} weight="700" color={ADMIN_INK}>{rupees(r.gmv)}</MonoText>
              </View>
            ))}
          </CardShell>
        </View>

        <View style={{ flex: 1, minWidth: 320 }}>
          <CardShell>
            <CardHeader title="By city" subtitle="Share of GMV" />
            {byCity.length === 0 ? (
              <EmptyState icon="mappin" title="No city signal yet" body="Once orders span cities, the share breaks down here." compact />
            ) : null}
            <View style={{ padding: 18, gap: 14 }}>
              {byCity.map(([city, gmv]) => {
                const pct = stats.gmv > 0 ? (gmv / stats.gmv) * 100 : 0;
                return (
                  <View key={city}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: ADMIN_INK }}>{city}</Text>
                      <MonoText size={11.5} color={ADMIN_INK2}>{rupees(gmv)} · {pct.toFixed(0)}%</MonoText>
                    </View>
                    <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: ADMIN_HAIRLINE, overflow: "hidden" }}>
                      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", backgroundColor: ADMIN_ACCENT2 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </CardShell>
        </View>
      </View>
    </PageScroll>
  );
}
