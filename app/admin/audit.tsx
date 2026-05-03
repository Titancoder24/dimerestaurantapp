import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Icon, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_MONO,
} from "@/components/admin/shell";

type Row = Tables<"audit_log"> & { actor: { name: string | null; email: string } | null };

const entityFilters = ["all", "users", "restaurants", "orders", "bookings", "campaigns", "feature_flags"] as const;

export default function AuditLog() {
  const [entity, setEntity] = useState<(typeof entityFilters)[number]>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit", entity],
    refetchInterval: 60_000,
    queryFn: async () => {
      let q = supabase
        .from("audit_log")
        .select("*, actor:users!audit_log_actor_id_fkey(name, email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (entity !== "all") q = q.eq("entity_type", entity);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = (data ?? []).filter((r) => {
    if (!search.trim()) return true;
    const hay = `${r.action} ${r.entity_type} ${r.actor?.email ?? ""} ${JSON.stringify(r.metadata)}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · SYSTEM · ENGINEERING"
        title="Audit log"
        subtitle="Last 200 mutating actions across staff, operators and admins. Auto-refreshes every minute."
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
              placeholder="Search action, actor or metadata"
              placeholderTextColor={ADMIN_INK3}
              style={{ flex: 1, color: ADMIN_INK, fontSize: 12.5, padding: 0, outlineStyle: "none" } as any}
            />
          </View>
        }
      />

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {entityFilters.map((f) => {
          const active = f === entity;
          const count = f === "all" ? (data ?? []).length : (data ?? []).filter((r) => r.entity_type === f).length;
          return (
            <Pressable
              key={f}
              onPress={() => { haptic.light(); setEntity(f); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, textTransform: "capitalize" }}>{f.replace("_", " ")}</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? ADMIN_BG : ADMIN_INK3, fontFamily: ADMIN_MONO }}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Event stream" subtitle={`${filtered.length} match · sorted newest first`} />
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon="doc.text.fill"
            title="No audit events"
            body="Mutations from staff, operator and admin actions land here once instrumented."
            compact
          />
        ) : null}
        {filtered.map((r, i) => (
          <View
            key={r.id}
            style={{
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={r.actor?.name ?? r.actor?.email ?? "system"} size={32} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: ADMIN_INK }}>
                  <Text style={{ fontWeight: "700" }}>{r.actor?.name ?? r.actor?.email ?? "system"}</Text>
                  <Text style={{ color: ADMIN_INK3 }}> {r.action} </Text>
                  <Text style={{ fontWeight: "600" }}>{r.entity_type}</Text>
                </Text>
                <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(r.created_at).toUpperCase()} · {(r.actor_role ?? "system").toUpperCase()}</MonoText>
              </View>
              <Pill>{r.entity_type}</Pill>
            </View>
            {r.metadata && Object.keys(r.metadata as object).length > 0 ? (
              <View
                style={{
                  marginTop: 10, padding: 10, borderRadius: 8,
                  backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
                }}
              >
                <Text style={{ fontSize: 11, color: ADMIN_INK2, fontFamily: ADMIN_MONO, lineHeight: 16 }}>
                  {JSON.stringify(r.metadata, null, 2)}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </CardShell>
    </PageScroll>
  );
}
