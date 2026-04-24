import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Avatar, Badge, Chip, Header, Icon, Input, Screen } from "@/components/ui";
import { useAdminUsers } from "@/hooks/admin";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const roleFilters = ["all", "customer", "owner", "manager", "super_admin"] as const;

export default function AdminUsers() {
  const qc = useQueryClient();
  const { data } = useAdminUsers();
  const [filter, setFilter] = useState<(typeof roleFilters)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (q && !(u.email + " " + (u.name ?? "")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("users").update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <Screen scroll={false}>
      <Header title="Users" subtitle={`${filtered.length} shown`} />
      <View className="px-4">
        <Input value={q} onChangeText={setQ} placeholder="Search name or email..." leading={<Icon name="magnifyingglass" size={16} color="#8E8E93" />} />
      </View>
      <View className="mt-3 px-4">
        <FlatList
          horizontal
          data={roleFilters}
          keyExtractor={(r) => r}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item} selected={filter === item} onPress={() => setFilter(item)} />}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 120 }}
        renderItem={({ item: u }) => (
          <View className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3">
            <Avatar name={u.name ?? u.email} size={36} />
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{u.name ?? "—"}</Text>
              <Text className="text-[11px] text-dime-ink-3">{u.email}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Badge tone={u.role === "super_admin" ? "gold" : u.role === "owner" ? "orange" : "gray"} label={u.role} />
                <Badge tone="gray" label={`${u.loyalty_points} pts`} />
                <Badge tone={u.loyalty_tier === "diamond" ? "blue" : u.loyalty_tier === "platinum" ? "gray" : u.loyalty_tier === "gold" ? "gold" : "gray"} label={u.loyalty_tier} />
              </View>
            </View>
            <Pressable onPress={() => toggleActive(u.id, u.is_active)} className={`rounded-full px-3 py-1.5 ${u.is_active ? "bg-emerald-50" : "bg-red-50"}`}>
              <Text className={`text-[11px] font-semibold ${u.is_active ? "text-emerald-700" : "text-dime-danger"}`}>{u.is_active ? "Active" : "Disabled"}</Text>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
