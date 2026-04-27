import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, Chip, ChipRow, Header, Icon, Input, Screen } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { timeAgo } from "@/lib/format";

type Row = Tables<"audit_log"> & { actor: { name: string | null; email: string } | null };

const entityFilters = ["all", "users", "restaurants", "orders", "bookings", "campaigns", "feature_flags"] as const;

export default function AuditLog() {
  const [entity, setEntity] = useState<(typeof entityFilters)[number]>("all");
  const [query, setQuery] = useState("");

  const { data } = useQuery({
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
    if (!query) return true;
    const hay = `${r.action} ${r.entity_type} ${r.actor?.email ?? ""} ${JSON.stringify(r.metadata)}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <Screen scroll={false}>
      <Header title="Audit Log" subtitle="Last 200 events" />

      <View className="px-5">
        <Input
          value={query} onChangeText={setQuery}
          placeholder="Search action, actor, metadata..."
          leading={<Icon name="magnifyingglass" size={16} color="#8A8A8A" />}
        />
      </View>

      <View className="mt-4 px-5">
        <FlatList
          horizontal
          data={entityFilters}
          keyExtractor={(e) => e}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item} selected={entity === item} onPress={() => setEntity(item)} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Icon name="doc.text.fill" size={28} color="#BFBFBF" />
            <Text className="mt-2 text-[13px] text-dime-ink-3">No audit events yet.</Text>
            <Text className="mt-1 max-w-[280px] text-center text-[11px] text-dime-ink-3">
              Mutations from staff/owner/admin actions will appear here once instrumented.
            </Text>
          </View>
        }
        renderItem={({ item: r }) => (
          <View className="rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View className="flex-row items-center gap-4">
              <Avatar name={r.actor?.name ?? r.actor?.email ?? "system"} size={32} />
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-dime-ink">
                  {r.actor?.name ?? r.actor?.email ?? "system"}
                  <Text className="font-normal text-dime-ink-3"> {r.action} </Text>
                  <Text className="font-normal">{r.entity_type}</Text>
                </Text>
                <Text className="text-[11px] text-dime-ink-3">{timeAgo(r.created_at)} · {r.actor_role ?? "—"}</Text>
              </View>
              <Badge tone="gray" label={r.entity_type} />
            </View>
            {r.metadata && Object.keys(r.metadata as object).length > 0 ? (
              <View className="mt-2 rounded-lg bg-dime-bg-2 p-2">
                <Text className="font-mono text-[10px] text-dime-ink-2">{JSON.stringify(r.metadata, null, 2)}</Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}
