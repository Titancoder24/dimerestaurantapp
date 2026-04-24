import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar, Badge, Header, Icon, Screen, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";

type LiveRow = {
  id: string;
  kind: "order" | "booking" | "signup" | "ticket" | "review";
  title: string;
  subtitle: string;
  amount?: string;
  tone: "orange" | "green" | "blue" | "red" | "gold" | "gray";
  icon: string;
  ts: string;
  link?: { pathname: string; params?: Record<string, string> };
};

export default function LiveOps() {
  const router = useRouter();
  const qc = useQueryClient();
  const [pulse, setPulse] = useState(false);

  // Active orders right now
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

  // Realtime pulse — flash a dot whenever something changes
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

  // Composite stream — interleave by ts
  const stream: LiveRow[] = [
    ...(orders ?? []).map<LiveRow>((o) => ({
      id: `o-${o.id}`,
      kind: "order",
      title: `${o.order_number} · ${o.restaurants?.name ?? "—"}`,
      subtitle: `${o.users?.name ?? "Walk-in"} · ${o.status}`,
      amount: rupees(o.total_amount),
      tone: o.status === "paid" ? "gray" : o.status === "ready" ? "green" : "orange",
      icon: "bag.fill",
      ts: o.created_at,
      link: { pathname: "/admin/users/[id]", params: { id: o.user_id ?? "" } },
    })),
    ...(bookingsToday ?? []).map<LiveRow>((b) => ({
      id: `b-${b.id}`,
      kind: "booking",
      title: `${b.restaurants?.name ?? "—"} · ${b.time}`,
      subtitle: `${b.users?.name ?? "Walk-in"} · ${b.guests} guests · ${b.status}`,
      tone: b.status === "confirmed" || b.status === "arrived" ? "green" : b.status === "cancelled" ? "red" : "orange",
      icon: "calendar",
      ts: b.created_at,
    })),
    ...(signups ?? []).map<LiveRow>((u) => ({
      id: `s-${u.id}`,
      kind: "signup",
      title: u.name ?? u.email,
      subtitle: `New ${u.role} signup`,
      tone: u.role === "owner" ? "orange" : "blue",
      icon: "person.fill",
      ts: u.created_at,
      link: { pathname: "/admin/users/[id]", params: { id: u.id } },
    })),
    ...(tickets ?? []).map<LiveRow>((t) => ({
      id: `t-${t.id}`,
      kind: "ticket",
      title: t.subject,
      subtitle: `${t.users?.name ?? "—"} · ${t.priority} priority`,
      tone: t.priority === "critical" || t.priority === "high" ? "red" : "gold",
      icon: "tray.fill",
      ts: t.created_at,
    })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const activeOrdersCount = (orders ?? []).filter((o) => o.status !== "paid").length;
  const todayGmv = (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs(), "day")).reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <Screen scroll={false}>
      <Header
        title="Mission Control"
        subtitle="Everything happening on the platform · live"
        right={
          <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1">
            <View className={`h-2 w-2 rounded-full ${pulse ? "bg-emerald-300" : "bg-emerald-500"}`} />
            <Text className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Live</Text>
          </View>
        }
      />

      <View className="flex-row gap-2 px-4">
        <Stat label="Active orders" value={String(activeOrdersCount)} icon="flame.fill" tone="bg-dime-orange-500" />
        <Stat label="Today GMV" value={rupees(todayGmv)} icon="chart.line.uptrend.xyaxis" tone="bg-emerald-500" />
        <Stat label="New today" value={String(signups?.length ?? 0)} icon="person.fill" tone="bg-blue-500" />
        <Stat label="Open tickets" value={String(tickets?.length ?? 0)} icon="tray.fill" tone="bg-dime-danger" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">Activity stream</Text>
        <View className="gap-1.5">
          {stream.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => row.link && router.push(row.link as never)}
              className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-dime-bg-2">
                <Icon name={row.icon} size={14} color="#FC8019" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-dime-ink" numberOfLines={1}>{row.title}</Text>
                <Text className="text-[11px] text-dime-ink-3">{row.subtitle} · {timeAgo(row.ts)}</Text>
              </View>
              {row.amount ? <Text className="text-[13px] font-semibold text-dime-ink">{row.amount}</Text> : null}
              <Badge tone={row.tone} label={row.kind} />
            </Pressable>
          ))}
          {stream.length === 0 ? (
            <View className="items-center py-12">
              <Icon name="checkmark.circle.fill" size={28} color="#22C55E" />
              <Text className="mt-2 text-[13px] text-dime-ink-3">All quiet on the platform.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: string }) {
  return (
    <View className={`flex-1 rounded-2xl ${tone} p-3`}>
      <View className="flex-row items-center gap-1">
        <Icon name={icon} size={12} color="#fff" />
        <Text className="text-[10px] font-bold uppercase tracking-widest text-white/90">{label}</Text>
      </View>
      <Text className="mt-1 text-[18px] font-bold text-white" numberOfLines={1}>{value}</Text>
    </View>
  );
}
