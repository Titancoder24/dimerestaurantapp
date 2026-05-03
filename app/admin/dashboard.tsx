import { useMemo } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui";
import { usePlatformStats } from "@/hooks/admin";
import { rupees } from "@/lib/format";
import dayjs from "dayjs";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatusDot, StatRow, StatTile, Pill,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

export default function AdminDashboard() {
  const router = useRouter();
  const { data, isLoading } = usePlatformStats();

  const restaurants = data?.restaurants ?? [];
  const users = data?.users ?? [];
  const orders = data?.recentOrders ?? [];

  const verified = restaurants.filter((r) => r.status === "verified").length;
  const pending = restaurants.filter((r) => r.status === "pending").length;
  const suspended = restaurants.filter((r) => r.status === "suspended").length;
  const customers = users.filter((u) => u.role === "customer").length;
  const owners = users.filter((u) => u.role === "owner").length;

  const today = dayjs();
  const todayGmv = orders.filter((o) => dayjs(o.created_at).isSame(today, "day")).reduce((s, o) => s + Number(o.total_amount), 0);
  const yesterdayGmv = orders.filter((o) => dayjs(o.created_at).isSame(today.subtract(1, "day"), "day")).reduce((s, o) => s + Number(o.total_amount), 0);
  const weekGmv = orders.filter((o) => dayjs(o.created_at).isAfter(today.subtract(7, "day"))).reduce((s, o) => s + Number(o.total_amount), 0);
  const monthGmv = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const dod = yesterdayGmv > 0 ? ((todayGmv - yesterdayGmv) / yesterdayGmv) * 100 : 0;

  const series = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = today.subtract(13 - i, "day");
      const dayTotal = orders.filter((o) => dayjs(o.created_at).isSame(d, "day")).reduce((s, o) => s + Number(o.total_amount), 0);
      return { day: d.format("DD MMM"), v: dayTotal };
    });
  }, [orders, today]);

  const peak = Math.max(1, ...series.map((s) => s.v));

  const cityRows = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of restaurants) {
      const c = r.city ?? "Unknown";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [restaurants]);

  return (
    <PageScroll>
      <PageHeader
        title="Mission control"
        subtitle="Live platform health, GMV, and tenant signal."
        rightAction="Open mission control"
        actionIcon="flame.fill"
        onAction={() => router.push("/admin/live" as never)}
      />

      <StatRow>
        <StatTile
          icon="indianrupeesign.circle.fill"
          iconBg="#2B1810" iconColor={ADMIN_ACCENT}
          label="GMV today"
          value={rupees(todayGmv)}
          hint={`vs ${rupees(yesterdayGmv)} yesterday`}
          delta={yesterdayGmv > 0 ? { value: `${Math.abs(dod).toFixed(1)}%`, positive: dod >= 0 } : undefined}
        />
        <StatTile
          icon="building.2.fill"
          iconBg="#1B1730" iconColor={ADMIN_ACCENT2}
          label="Tenants"
          value={String(restaurants.length)}
          hint={`${verified} verified · ${pending} pending`}
        />
        <StatTile
          icon="person.3.fill"
          iconBg="#0E2F1F" iconColor={ADMIN_GREEN}
          label="People on DIME"
          value={String(users.length)}
          hint={`${customers.toLocaleString("en-IN")} diners · ${owners} operators`}
        />
        <StatTile
          icon="clock.fill"
          iconBg="#2A2210" iconColor={ADMIN_AMBER}
          label="Pending review"
          value={String(pending)}
          hint="Restaurant applications waiting on you"
        />
      </StatRow>

      {/* GMV chart + composition strip */}
      <CardShell>
        <CardHeader
          title="Platform GMV — last 14 days"
          subtitle={`${rupees(weekGmv)} this week · ${rupees(monthGmv)} last 30 days`}
          right={<Pill tone="saffron" icon="bolt.fill">Live</Pill>}
        />
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 140 }}>
            {series.map((s, i) => {
              const h = Math.max(2, (s.v / peak) * 130);
              const isPeak = s.v === peak && peak > 0;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      width: "100%", height: h, borderRadius: 4,
                      backgroundColor: isPeak ? ADMIN_ACCENT : ADMIN_HAIRLINE2,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", marginTop: 6 }}>
            {series.map((s, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                {i % 3 === 0 ? (
                  <Text style={{ fontSize: 9.5, color: ADMIN_INK3, fontFamily: ADMIN_MONO }}>{s.day}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
        {orders.length === 0 && !isLoading ? (
          <EmptyState
            icon="chart.line.uptrend.xyaxis"
            title="No orders in the window"
            body="As soon as restaurants take their first orders, GMV charts populate here."
            compact
          />
        ) : null}
      </CardShell>

      {/* Bottom row */}
      <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 320 }}>
          <CardShell>
            <CardHeader title="Top cities" subtitle="By verified tenant count" />
            {cityRows.length === 0 ? (
              <EmptyState icon="mappin" title="No cities yet" body="Once restaurants are onboarded, your top cities will rank here." compact />
            ) : (
              cityRows.map(([city, count], i) => (
                <View
                  key={city}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingHorizontal: 18, paddingVertical: 12,
                    borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
                  }}
                >
                  <View
                    style={{
                      width: 28, height: 28, borderRadius: 7,
                      backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: ADMIN_INK, fontFamily: ADMIN_MONO }}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: ADMIN_INK }}>{city}</Text>
                  <MonoText size={13} weight="700">{count}</MonoText>
                </View>
              ))
            )}
          </CardShell>
        </View>

        <View style={{ flex: 1, minWidth: 320 }}>
          <CardShell>
            <CardHeader title="Tenant status" subtitle="Across the platform" />
            <StatusRow label="Verified" value={verified} dot={ADMIN_GREEN} pill="green" />
            <StatusRow label="Pending review" value={pending} dot={ADMIN_AMBER} pill="amber" />
            <StatusRow label="Suspended" value={suspended} dot={ADMIN_RED} pill="red" last />
          </CardShell>
        </View>
      </View>
    </PageScroll>
  );
}

function StatusRow({ label, value, dot, pill, last }: { label: string; value: number; dot: string; pill: "green" | "amber" | "red"; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 18, paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: ADMIN_HAIRLINE,
      }}
    >
      <StatusDot color={dot} size={8} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: ADMIN_INK }}>{label}</Text>
      <Pill tone={pill}>{value} {value === 1 ? "tenant" : "tenants"}</Pill>
    </View>
  );
}
