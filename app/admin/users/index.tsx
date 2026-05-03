import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Icon, haptic } from "@/components/ui";
import { useAdminUsers } from "@/hooks/admin";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatRow, StatTile, Pill, StatusDot,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type RoleFilter = "all" | "customer" | "owner" | "manager" | "super_admin";
const roleFilters: RoleFilter[] = ["all", "customer", "owner", "manager", "super_admin"];

const roleTone: Record<string, "neutral" | "saffron" | "lilac" | "green" | "amber"> = {
  customer: "neutral", owner: "saffron", manager: "lilac", super_admin: "amber",
};

const tierColor: Record<string, string> = {
  diamond: "#5EEAD4", platinum: "#D4D4D4", gold: "#F8B400", silver: "#A3A3A3", bronze: "#B45309",
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading } = useAdminUsers();
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const list = data ?? [];
  const customers = list.filter((u) => u.role === "customer").length;
  const owners = list.filter((u) => u.role === "owner").length;
  const admins = list.filter((u) => u.role === "super_admin").length;
  const inactive = list.filter((u) => !u.is_active).length;

  const filtered = useMemo(() => {
    return list.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!(u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [list, filter, search]);

  async function toggleActive(id: string, current: boolean) {
    try {
      const { error } = await supabase.from("users").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success(!current ? "User re-enabled" : "User disabled");
    } catch (e) {
      toast.error("Could not update", (e as Error).message);
    }
  }

  return (
    <PageScroll>
      <PageHeader
        title="People on DIME"
        subtitle={`${list.length.toLocaleString("en-IN")} accounts · ${customers.toLocaleString("en-IN")} diners`}
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
              placeholder="Search name or email"
              placeholderTextColor={ADMIN_INK3}
              style={{ flex: 1, color: ADMIN_INK, fontSize: 12.5, padding: 0, outlineStyle: "none" } as any}
            />
          </View>
        }
      />

      <StatRow>
        <StatTile icon="person.fill" iconBg="#1F1F1F" iconColor={ADMIN_INK} label="Total accounts" value={String(list.length)} hint="All roles combined" />
        <StatTile icon="fork.knife" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Diners" value={String(customers)} hint="Customers on the app" />
        <StatTile icon="building.2.fill" iconBg="#1B1730" iconColor={ADMIN_ACCENT2} label="Operators" value={String(owners)} hint="Restaurant owners" />
        <StatTile icon="shield.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="Admins" value={String(admins)} hint={`${inactive} disabled`} />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {roleFilters.map((f) => {
          const active = f === filter;
          const count = f === "all" ? list.length : list.filter((u) => u.role === f).length;
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
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, textTransform: "capitalize" }}>
                {f.replace("_", " ")}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? ADMIN_BG : ADMIN_INK3, fontFamily: ADMIN_MONO }}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Account directory" subtitle={`${filtered.length} match · click to inspect`} />
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon="person.fill"
            title={search ? "No accounts matched" : "Nothing in this bucket"}
            body={search ? "Try a different search term." : "Once people sign up, they'll appear here."}
            compact
          />
        ) : null}
        {filtered.map((u, i) => (
          <Pressable
            key={u.id}
            onPress={() => router.push({ pathname: "/admin/users/[id]", params: { id: u.id } })}
            style={({ hovered }: any) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              backgroundColor: hovered ? ADMIN_HOVER : "transparent",
            })}
          >
            <Avatar name={u.name ?? u.email} uri={u.avatar_url} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK, flexShrink: 1 }}>
                  {u.name ?? "Unnamed"}
                </Text>
                <Pill tone={roleTone[u.role] ?? "neutral"}>{u.role.replace("_", " ")}</Pill>
              </View>
              <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 12, color: ADMIN_INK2 }}>{u.email}</Text>
              <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <StatusDot color={tierColor[u.loyalty_tier] ?? ADMIN_INK3} size={5} />
                  <MonoText size={10.5} color={ADMIN_INK3}>{u.loyalty_tier.toUpperCase()} · {u.loyalty_points} PTS</MonoText>
                </View>
              </View>
            </View>
            <Pressable
              onPress={(e) => { e.stopPropagation(); toggleActive(u.id, u.is_active); }}
              hitSlop={6}
              style={{
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
                backgroundColor: u.is_active ? "#0E2F1F" : "#3A1212",
                borderWidth: 1, borderColor: u.is_active ? "#1A5C3A" : "#5C1E1E",
                flexDirection: "row", alignItems: "center", gap: 5,
              }}
            >
              <StatusDot color={u.is_active ? ADMIN_GREEN : ADMIN_RED} size={5} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: u.is_active ? ADMIN_GREEN : ADMIN_RED, fontFamily: ADMIN_MONO, letterSpacing: 0.4, textTransform: "uppercase" }}>
                {u.is_active ? "Active" : "Disabled"}
              </Text>
            </Pressable>
          </Pressable>
        ))}
      </CardShell>
    </PageScroll>
  );
}
