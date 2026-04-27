import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Avatar, Badge, Chip, Header, Icon, Screen } from "@/components/ui";
import { useAdminTickets } from "@/hooks/admin";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/format";

const statusFilters = ["all", "open", "in_progress", "resolved"] as const;

export default function AdminSupport() {
  const qc = useQueryClient();
  const { data } = useAdminTickets();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");

  const filtered = (data ?? []).filter((t) => filter === "all" || t.status === filter);
  const counts = {
    open: (data ?? []).filter((t) => t.status === "open").length,
    inProgress: (data ?? []).filter((t) => t.status === "in_progress").length,
    resolved: (data ?? []).filter((t) => t.status === "resolved").length,
  };

  async function setStatus(id: string, status: "in_progress" | "resolved" | "open") {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-tickets"] });
  }

  return (
    <Screen scroll={false}>
      <Header title="Support Helpdesk" subtitle={`${filtered.length} of ${data?.length ?? 0}`} />

      <View className="flex-row gap-2 px-5">
        <Tile color="bg-dime-danger" label="Open" value={counts.open} />
        <Tile color="bg-amber-500" label="In Progress" value={counts.inProgress} />
        <Tile color="bg-emerald-500" label="Resolved" value={counts.resolved} />
      </View>

      <View className="mt-4 px-5">
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item.replace("_", " ")} selected={filter === item} onPress={() => setFilter(item)} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: t }) => (
          <View className="rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View className="flex-row items-center gap-4">
              <Avatar name={t.users?.name ?? t.users?.email ?? "?"} size={36} />
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-dime-ink">{t.subject}</Text>
                <Text className="text-[11px] text-dime-ink-3">{t.ticket_number} • {t.users?.email} • {timeAgo(t.created_at)}</Text>
              </View>
              <Badge tone={t.priority === "critical" ? "red" : t.priority === "high" ? "orange" : "gray"} label={t.priority} />
            </View>
            <View className="mt-2 flex-row items-center gap-2">
              <Badge tone="blue" label={t.category.replace("_", " ")} />
              <Badge tone={t.status === "resolved" ? "green" : t.status === "in_progress" ? "orange" : "red"} label={t.status} />
              <View className="ml-auto flex-row gap-2">
                {t.status === "open" ? (
                  <Pressable onPress={() => setStatus(t.id, "in_progress")} className="rounded-full bg-dime-primary-500 px-3 py-1">
                    <Text className="text-[11px] font-bold text-white">Take</Text>
                  </Pressable>
                ) : null}
                {t.status === "in_progress" ? (
                  <Pressable onPress={() => setStatus(t.id, "resolved")} className="rounded-full bg-emerald-500 px-3 py-1">
                    <Text className="text-[11px] font-bold text-white">Resolve</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

function Tile({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} py-3`}>
      <Text className="text-[24px] font-bold text-white">{value}</Text>
      <Text className="text-[11px] font-bold uppercase text-white/90" style={{ letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}
