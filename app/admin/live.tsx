import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Icon } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatRow, StatTile, Pill, StatusDot,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type LiveKind = "order" | "booking" | "signup" | "ticket";
type LiveRow = {
  id: string;
  kind: LiveKind;
  title: string;
  subtitle: string;
  amount?: string;
  tone: "neutral" | "saffron" | "lilac" | "green" | "red" | "amber";
  icon: string;
  iconBg: string;
  iconColor: string;
  ts: string;
  link?: { pathname: string; params?: Record<string, string> };
};

const kindStyle: Record<LiveKind, { bg: string; color: string }> = {
  order:   { bg: "#2B1810", color: ADMIN_ACCENT },
  booking: { bg: "#1B1730", color: ADMIN_ACCENT2 },
  signup:  { bg: "#0E2F1F", color: ADMIN_GREEN },
  ticket:  { bg: "#3A1212", color: ADMIN_RED },
};

export default function LiveOps() {
  const router = useRouter();
  const qc = useQueryClient();
  const [pulse, setPulse] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["live-orders"],
    refetchInterval: 5_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name), users(name, email)")
        .in("status", ["received", "preparing", "ready", "served"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (Tables<"orders"> & { restaurants: { name: string } | null; users: { name: string | null; email: string } | null })[];
    },
  });

  const { data: bookingsToday } = useQuery({
    queryKey: ["live-bookings"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, restaurants(name), users(name)")
        .eq("date", dayjs().format("YYYY-MM-DD"))
        .order("time")
        .limit(50);
      if (error) throw error;
      return data as (Tables<"bookings"> & { restaurants: { name: string } | null; users: { name: string | null } | null })[];
    },
  });

  const { data: signups } = useQuery({
    queryKey: ["live-signups"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .gt("created_at", dayjs().subtract(24, "hour").toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Pick<Tables<"users">, "id" | "name" | "email" | "role" | "created_at">[];
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ["live-tickets"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, users(name)")
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as (Tables<"support_tickets"> & { users: { name: string | null } | null })[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("live-ops")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        setPulse(true); setTimeout(() => setPulse(false), 600);
        qc.invalidateQueries({ queryKey: ["live-orders"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "users" }, () => {
        qc.invalidateQueries({ queryKey: ["live-signups"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        qc.invalidateQueries({ queryKey: ["live-bookings"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        qc.invalidateQueries({ queryKey: ["live-tickets"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const stream: LiveRow[] = [
    ...(orders ?? []).map<LiveRow>((o) => ({
      id: `o-${o.id}`, kind: "order",
      title: `${o.order_number} · ${o.restaurants?.name ?? "—"}`,
      subtitle: `${o.users?.name ?? "Walk-in"} · ${o.status}`,
      amount: rupees(o.total_amount),
      tone: o.status === "paid" ? "green" : o.status === "ready" ? "lilac" : "saffron",
      icon: "bag.fill", iconBg: kindStyle.order.bg, iconColor: kindStyle.order.color,
      ts: o.created_at,
      link: { pathname: "/admin/users/[id]", params: { id: o.user_id ?? "" } },
    })),
    ...(bookingsToday ?? []).map<LiveRow>((b) => ({
      id: `b-${b.id}`, kind: "booking",
      title: `${b.restaurants?.name ?? "—"} · ${b.time}`,
      subtitle: `${b.users?.name ?? "Walk-in"} · ${b.guests} guests · ${b.status}`,
      tone: b.status === "confirmed" || b.status === "arrived" ? "green" : b.status === "cancelled" ? "red" : "amber",
      icon: "calendar", iconBg: kindStyle.booking.bg, iconColor: kindStyle.booking.color,
      ts: b.created_at,
    })),
    ...(signups ?? []).map<LiveRow>((u) => ({
      id: `s-${u.id}`, kind: "signup",
      title: u.name ?? u.email,
      subtitle: `New ${u.role} signup`,
      tone: u.role === "owner" ? "saffron" : "neutral",
      icon: "person.fill", iconBg: kindStyle.signup.bg, iconColor: kindStyle.signup.color,
      ts: u.created_at,
      link: { pathname: "/admin/users/[id]", params: { id: u.id } },
    })),
    ...(tickets ?? []).map<LiveRow>((t) => ({
      id: `t-${t.id}`, kind: "ticket",
      title: t.subject,
      subtitle: `${t.users?.name ?? "—"} · ${t.priority} priority`,
      tone: t.priority === "critical" || t.priority === "high" ? "red" : "amber",
      icon: "tray.fill", iconBg: kindStyle.ticket.bg, iconColor: kindStyle.ticket.color,
      ts: t.created_at,
    })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const activeOrdersCount = (orders ?? []).filter((o) => o.status !== "paid").length;
  const todayGmv = (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs(), "day")).reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <PageScroll>
      <PageHeader
        title="Mission control"
        subtitle="Real-time order, booking, signup and ticket stream — auto-refreshes via Supabase realtime."
        rightSlot={
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
              backgroundColor: "#0E2F1F", borderWidth: 1, borderColor: "#1A5C3A",
            }}
          >
            <View
              style={{
                width: 7, height: 7, borderRadius: 3.5,
                backgroundColor: pulse ? "#86EFAC" : ADMIN_GREEN,
              }}
            />
            <Text style={{ fontSize: 10.5, fontWeight: "700", color: ADMIN_GREEN, letterSpacing: 0.8, fontFamily: ADMIN_MONO }}>
              LIVE FEED
            </Text>
          </View>
        }
      />

      <StatRow>
        <StatTile icon="flame.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Active orders" value={String(activeOrdersCount)} hint="Cooking right now" />
        <StatTile icon="indianrupeesign.circle.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Today GMV" value={rupees(todayGmv)} hint="Across the network" />
        <StatTile icon="person.fill" iconBg="#1B1730" iconColor={ADMIN_ACCENT2} label="New users 24h" value={String(signups?.length ?? 0)} hint="Diners & operators" />
        <StatTile icon="tray.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="Open tickets" value={String(tickets?.length ?? 0)} hint="Support backlog" />
      </StatRow>

      <CardShell>
        <CardHeader title="Activity stream" subtitle={`${stream.length} events · sorted newest first`} right={pulse ? <Pill tone="green" icon="bolt.fill">Pulse</Pill> : null} />
        {stream.length === 0 ? (
          <EmptyState
            icon="checkmark.circle.fill"
            iconColor={ADMIN_GREEN}
            iconBg="#0E2F1F"
            title="All quiet on the platform"
            body="When orders fire, bookings come in, or new diners sign up — they'll appear here in real-time."
            compact
          />
        ) : null}
        {stream.map((row, i) => (
          <Pressable
            key={row.id}
            onPress={() => row.link && router.push(row.link as never)}
            disabled={!row.link}
            style={({ hovered }: any) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              backgroundColor: hovered && row.link ? ADMIN_HOVER : "transparent",
            })}
          >
            <View
              style={{
                width: 36, height: 36, borderRadius: 9,
                backgroundColor: row.iconBg,
                borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name={row.icon} size={14} color={row.iconColor} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: ADMIN_INK }}>{row.title}</Text>
              <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 11.5, color: ADMIN_INK2 }}>{row.subtitle}</Text>
              <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(row.ts).toUpperCase()}</MonoText>
            </View>
            {row.amount ? <MonoText size={13} weight="700" color={ADMIN_INK}>{row.amount}</MonoText> : null}
            <Pill tone={row.tone}>{row.kind}</Pill>
          </Pressable>
        ))}
      </CardShell>
    </PageScroll>
  );
}
