import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  StatRow, StatTile,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE,
  ADMIN_PANEL, ADMIN_HOVER, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type FlaggedRow = {
  id: string;
  name: string | null;
  email: string;
  is_active: boolean;
  bookings: number;
  no_shows: number;
  cancellations: number;
  tickets_open: number;
  orders_count: number;
  refunds: number;
  risk_score: number;
};

type Filter = "all" | "high" | "extreme";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "high", label: "High +" },
  { id: "extreme", label: "Extreme" },
];

export default function Risk() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("high");

  const { data } = useQuery({
    queryKey: ["risk", filter],
    refetchInterval: 60_000,
    queryFn: async () => {
      let q = supabase.from("flagged_users").select("*").order("risk_score", { ascending: false });
      if (filter === "high") q = q.gte("risk_score", 30);
      if (filter === "extreme") q = q.gte("risk_score", 60);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data as FlaggedRow[];
    },
  });

  const list = data ?? [];
  const counts = {
    extreme: list.filter((u) => u.risk_score >= 60).length,
    high: list.filter((u) => u.risk_score >= 30 && u.risk_score < 60).length,
    moderate: list.filter((u) => u.risk_score < 30).length,
  };

  async function suspend(id: string) {
    try {
      await supabase.from("users").update({ is_active: false }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["risk"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Account suspended");
    } catch (e) {
      toast.error("Could not suspend", (e as Error).message);
    }
  }

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · GROWTH · RISK & FRAUD"
        title="Risk & fraud"
        subtitle="Auto-flagged accounts by no-show, cancellation and ticket signal."
      />

      <StatRow>
        <StatTile icon="exclamationmark.octagon.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="Extreme" value={String(counts.extreme)} hint="Risk score ≥ 60" />
        <StatTile icon="exclamationmark.triangle.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="High" value={String(counts.high)} hint="30 ≤ score < 60" />
        <StatTile icon="checkmark.shield.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Moderate" value={String(counts.moderate)} hint="Below threshold" />
        <StatTile icon="person.fill" iconBg="#141414" iconColor={ADMIN_INK} label="In window" value={String(list.length)} hint="Total flagged accounts" />
      </StatRow>

      <CardShell padded>
        <Text style={{ fontSize: 11, fontWeight: "700", color: ADMIN_INK3, letterSpacing: 1.2, fontFamily: ADMIN_MONO }}>
          RISK SCORE FORMULA
        </Text>
        <Text style={{ marginTop: 6, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 19 }}>
          15 points per no-show · 5 points per cancellation · 8 points per open ticket. Capped at 100. The view auto-refreshes every minute.
        </Text>
      </CardShell>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <Pressable
              key={f.id}
              onPress={() => { haptic.light(); setFilter(f.id); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2 }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Flagged accounts" subtitle={`${list.length} match · sorted by risk score`} />
        {list.length === 0 ? (
          <EmptyState
            icon="checkmark.shield.fill"
            iconColor={ADMIN_GREEN}
            iconBg="#0E2F1F"
            title="No risky accounts"
            body="No-show rate and complaint volume are within healthy bounds."
            compact
          />
        ) : null}
        {list.map((item, i) => {
          const scoreColor = item.risk_score >= 60 ? ADMIN_RED : item.risk_score >= 30 ? ADMIN_AMBER : ADMIN_GREEN;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: "/admin/users/[id]", params: { id: item.id } })}
              style={({ hovered }: any) => ({
                paddingHorizontal: 18, paddingVertical: 14,
                borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
                backgroundColor: hovered ? ADMIN_HOVER : "transparent",
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Avatar name={item.name ?? item.email} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK }}>{item.name ?? "Unnamed"}</Text>
                  <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: ADMIN_INK2 }}>{item.email}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <MonoText size={20} weight="700" color={scoreColor}>{item.risk_score}</MonoText>
                  <MonoText size={10} color={ADMIN_INK3}>RISK</MonoText>
                </View>
              </View>
              <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <Pill tone={item.no_shows > 0 ? "red" : "neutral"}>{item.no_shows} no-show</Pill>
                <Pill tone={item.cancellations > 1 ? "amber" : "neutral"}>{item.cancellations} cancels</Pill>
                <Pill tone={item.tickets_open > 0 ? "red" : "neutral"}>{item.tickets_open} open tickets</Pill>
                <Pill>{item.orders_count} orders</Pill>
                {!item.is_active ? <Pill tone="red">Suspended</Pill> : null}
              </View>
              {item.is_active && item.risk_score >= 60 ? (
                <View style={{ marginTop: 12 }}>
                  <Button label="Suspend account" variant="destructive" size="sm" onPress={() => suspend(item.id)} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </CardShell>
    </PageScroll>
  );
}
