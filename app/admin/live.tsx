import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Badge, Icon, Screen, haptic } from "@/components/ui";
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
  iconBg: string;
  iconColor: string;
  ts: string;
  link?: { pathname: string; params?: Record<string, string> };
};

const kindIcon = {
  order: { bg: "#FFF7ED", color: "#EA580C" },
  booking: { bg: "#EFF6FF", color: "#2563EB" },
  signup: { bg: "#F0FDF4", color: "#16A34A" },
  ticket: { bg: "#FEF2F2", color: "#DC2626" },
} as const;

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
      tone: o.status === "paid" ? "gray" : o.status === "ready" ? "green" : "orange",
      icon: "bag.fill", iconBg: kindIcon.order.bg, iconColor: kindIcon.order.color,
      ts: o.created_at,
      link: { pathname: "/admin/users/[id]", params: { id: o.user_id ?? "" } },
    })),
    ...(bookingsToday ?? []).map<LiveRow>((b) => ({
      id: `b-${b.id}`, kind: "booking",
      title: `${b.restaurants?.name ?? "—"} · ${b.time}`,
      subtitle: `${b.users?.name ?? "Walk-in"} · ${b.guests} guests · ${b.status}`,
      tone: b.status === "confirmed" || b.status === "arrived" ? "green" : b.status === "cancelled" ? "red" : "orange",
      icon: "calendar", iconBg: kindIcon.booking.bg, iconColor: kindIcon.booking.color,
      ts: b.created_at,
    })),
    ...(signups ?? []).map<LiveRow>((u) => ({
      id: `s-${u.id}`, kind: "signup",
      title: u.name ?? u.email,
      subtitle: `New ${u.role} signup`,
      tone: u.role === "owner" ? "orange" : "blue",
      icon: "person.fill", iconBg: kindIcon.signup.bg, iconColor: kindIcon.signup.color,
      ts: u.created_at,
      link: { pathname: "/admin/users/[id]", params: { id: u.id } },
    })),
    ...(tickets ?? []).map<LiveRow>((t) => ({
      id: `t-${t.id}`, kind: "ticket",
      title: t.subject,
      subtitle: `${t.users?.name ?? "—"} · ${t.priority} priority`,
      tone: t.priority === "critical" || t.priority === "high" ? "red" : "gold",
      icon: "tray.fill", iconBg: kindIcon.ticket.bg, iconColor: kindIcon.ticket.color,
      ts: t.created_at,
    })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const activeOrdersCount = (orders ?? []).filter((o) => o.status !== "paid").length;
  const todayGmv = (orders ?? []).filter((o) => dayjs(o.created_at).isSame(dayjs(), "day")).reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <Screen scroll={false} className="bg-neutral-50">
      {/* Header */}
      <View className="bg-white px-6 pb-4 pt-5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Live</Text>
            <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Mission Control</Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5" style={{ borderWidth: 1, borderColor: "#BBF7D0" }}>
            <View className={`h-2 w-2 rounded-full ${pulse ? "bg-emerald-300" : "bg-emerald-500"}`} />
            <Text className="text-[11px] font-bold uppercase text-emerald-700" style={{ letterSpacing: 1 }}>Live</Text>
          </View>
        </View>

        {/* Stats row */}
        <View className="mt-4 flex-row gap-3">
          <Stat label="Active orders" value={String(activeOrdersCount)} bg="#FFF7ED" color="#EA580C" icon="flame.fill" />
          <Stat label="Today GMV" value={rupees(todayGmv)} bg="#F0FDF4" color="#16A34A" icon="chart.line.uptrend.xyaxis" />
          <Stat label="New users" value={String(signups?.length ?? 0)} bg="#EFF6FF" color="#2563EB" icon="person.fill" />
          <Stat label="Open tickets" value={String(tickets?.length ?? 0)} bg="#FEF2F2" color="#DC2626" icon="tray.fill" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text className="mb-3 text-[11px] font-bold uppercase text-neutral-400" style={{ letterSpacing: 1.2 }}>Activity stream</Text>
        <View className="gap-2">
          {stream.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => row.link && router.push(row.link as never)}
              className="flex-row items-center gap-3.5 rounded-2xl bg-white p-4"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: row.iconBg }}>
                <Icon name={row.icon} size={15} color={row.iconColor} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-dime-ink" numberOfLines={1}>{row.title}</Text>
                <Text className="mt-0.5 text-[11px] text-dime-ink-4">{row.subtitle} · {timeAgo(row.ts)}</Text>
              </View>
              {row.amount ? <Text className="text-[13px] font-bold text-dime-ink">{row.amount}</Text> : null}
              <Badge tone={row.tone} label={row.kind} />
            </Pressable>
          ))}
          {stream.length === 0 ? (
            <View className="items-center py-16">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <Icon name="checkmark.circle.fill" size={24} color="#22C55E" />
              </View>
              <Text className="text-[14px] font-medium text-dime-ink-3">All quiet on the platform.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, bg, color, icon }: { label: string; value: string; bg: string; color: string; icon: string }) {
  return (
    <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: bg }}>
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={11} color={color} />
        <Text className="text-[10px] font-bold uppercase" style={{ color, letterSpacing: 0.8 }}>{label}</Text>
      </View>
      <Text className="mt-1 text-[18px] font-bold" numberOfLines={1} style={{ color, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
}
