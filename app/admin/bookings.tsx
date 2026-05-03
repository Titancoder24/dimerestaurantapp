import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar, Icon, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { fullDate, time12 } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatRow, StatTile, Pill,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type WhenFilter = "all" | "today" | "upcoming" | "past";
type StatusFilter = "all" | "pending" | "confirmed" | "arrived" | "cancelled" | "no_show" | "completed";
const whenFilters: WhenFilter[] = ["all", "today", "upcoming", "past"];
const statusFilters: StatusFilter[] = ["all", "pending", "confirmed", "arrived", "cancelled", "no_show", "completed"];

const statusTone: Record<string, "neutral" | "saffron" | "lilac" | "green" | "red" | "amber"> = {
  pending: "amber", confirmed: "saffron", arrived: "green", completed: "green",
  cancelled: "red", no_show: "red",
};

type Row = Tables<"bookings"> & {
  users: { id: string; name: string | null; email: string } | null;
  restaurants: { name: string | null } | null;
};

export default function AdminBookings() {
  const router = useRouter();
  const [when, setWhen] = useState<WhenFilter>("today");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", when],
    queryFn: async () => {
      const today = dayjs().format("YYYY-MM-DD");
      let q = supabase
        .from("bookings")
        .select("*, users(id, name, email), restaurants(name)")
        .order("date", { ascending: false }).order("time", { ascending: false }).limit(200);
      if (when === "today") q = q.eq("date", today);
      else if (when === "upcoming") q = q.gte("date", today);
      else if (when === "past") q = q.lt("date", today);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const list = data ?? [];
  const confirmed = list.filter((b) => b.status === "confirmed" || b.status === "arrived" || b.status === "completed").length;
  const pending = list.filter((b) => b.status === "pending").length;
  const noShows = list.filter((b) => b.status === "no_show").length;
  const totalGuests = list.reduce((s, b) => s + b.guests, 0);

  const filtered = useMemo(() => list.filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${b.users?.name ?? ""} ${b.users?.email ?? ""} ${b.restaurants?.name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [list, status, search]);

  return (
    <PageScroll>
      <PageHeader
        title="Bookings"
        subtitle={`${list.length} reservations · ${totalGuests} covers in window`}
        rightSlot={
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              height: 34, paddingHorizontal: 10, borderRadius: 8,
              backgroundColor: ADMIN_PANEL, borderWidth: 1, borderColor: ADMIN_HAIRLINE,
              minWidth: 240,
            }}
          >
            <Icon name="magnifyingglass" size={12} color={ADMIN_INK3} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search customer or restaurant"
              placeholderTextColor={ADMIN_INK3}
              style={{ flex: 1, color: ADMIN_INK, fontSize: 12.5, padding: 0, outlineStyle: "none" } as any}
            />
          </View>
        }
      />

      <StatRow>
        <StatTile icon="calendar" iconBg="#1B1730" iconColor={ADMIN_ACCENT2} label="Total" value={String(list.length)} hint={`${totalGuests} covers`} />
        <StatTile icon="checkmark.seal.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Confirmed" value={String(confirmed)} hint="Including arrived & completed" />
        <StatTile icon="clock.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="Pending" value={String(pending)} hint="Awaiting host action" />
        <StatTile icon="exclamationmark.triangle.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="No-shows" value={String(noShows)} hint={`${list.length > 0 ? Math.round((noShows / list.length) * 100) : 0}% of recent`} />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {whenFilters.map((f) => {
            const active = f === when;
            return (
              <Pressable
                key={f}
                onPress={() => { haptic.light(); setWhen(f); }}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                  backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                  borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, textTransform: "capitalize" }}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {statusFilters.map((f) => {
            const active = f === status;
            const count = f === "all" ? list.length : list.filter((b) => b.status === f).length;
            return (
              <Pressable
                key={f}
                onPress={() => { haptic.light(); setStatus(f); }}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
                  flexDirection: "row", alignItems: "center", gap: 5,
                  backgroundColor: active ? ADMIN_PANEL2 : "transparent",
                  borderWidth: 1, borderColor: active ? ADMIN_HAIRLINE2 : ADMIN_HAIRLINE,
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: "600", color: active ? ADMIN_INK : ADMIN_INK3, textTransform: "capitalize" }}>{f.replace("_", " ")}</Text>
                <Text style={{ fontSize: 10.5, color: active ? ADMIN_INK2 : ADMIN_INK3, fontFamily: ADMIN_MONO }}>{count}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <CardShell>
        <CardHeader title="Booking feed" subtitle={`${filtered.length} match · click a row to inspect the customer`} />
        {filtered.length === 0 && !isLoading ? (
          <EmptyState icon="calendar" title="No bookings match" body="Adjust the time window or status filters above." compact />
        ) : null}
        {filtered.map((b, i) => (
          <Pressable
            key={b.id}
            onPress={() => b.users?.id && router.push({ pathname: "/admin/users/[id]", params: { id: b.users.id } })}
            style={({ hovered }: any) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              backgroundColor: hovered ? ADMIN_HOVER : "transparent",
            })}
          >
            <Avatar name={b.users?.name ?? "Walk-in"} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK }}>
                {b.users?.name ?? "Walk-in"}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: ADMIN_INK2 }}>
                {b.restaurants?.name ?? "—"}
              </Text>
              <View style={{ marginTop: 3, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MonoText size={10.5} color={ADMIN_INK3}>{fullDate(b.date).toUpperCase()} · {time12(b.time)}</MonoText>
                <MonoText size={10.5} color={ADMIN_INK3}>· {b.guests} GUESTS · {b.seating_preference?.toUpperCase() ?? "ANY"}</MonoText>
              </View>
            </View>
            <Pill tone={statusTone[b.status] ?? "neutral"}>{b.status.replace("_", " ")}</Pill>
          </Pressable>
        ))}
      </CardShell>
    </PageScroll>
  );
}
