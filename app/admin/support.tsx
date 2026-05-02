import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Avatar, Badge, Chip, Icon, Screen } from "@/components/ui";
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
    <Screen scroll={false} className="bg-neutral-50">
      <View className="bg-white px-6 pb-4 pt-5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }}>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Platform</Text>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Support Helpdesk</Text>
          <Text className="text-[13px] text-dime-ink-4">{filtered.length} of {data?.length ?? 0}</Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Tile bg="#FEF2F2" color="#DC2626" label="Open" value={counts.open} icon="exclamationmark.triangle.fill" />
          <Tile bg="#FFFBEB" color="#D97706" label="In Progress" value={counts.inProgress} icon="clock.fill" />
          <Tile bg="#F0FDF4" color="#16A34A" label="Resolved" value={counts.resolved} icon="checkmark.circle.fill" />
        </View>

        <View className="mt-3">
          <FlatList
            horizontal
            data={statusFilters}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => <Chip label={item.replace("_", " ")} selected={filter === item} onPress={() => setFilter(item)} />}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: t }) => (
          <View
            className="rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
          >
            <View className="flex-row items-center gap-3.5">
              <Avatar name={t.users?.name ?? t.users?.email ?? "?"} size={38} />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{t.subject}</Text>
                <Text className="mt-0.5 text-[11px] text-dime-ink-4">{t.ticket_number} · {t.users?.email} · {timeAgo(t.created_at)}</Text>
              </View>
              <Badge tone={t.priority === "critical" ? "red" : t.priority === "high" ? "orange" : "gray"} label={t.priority} />
            </View>
            <View className="mt-3 flex-row items-center gap-2">
              <Badge tone="blue" label={t.category.replace("_", " ")} />
              <Badge tone={t.status === "resolved" ? "green" : t.status === "in_progress" ? "orange" : "red"} label={t.status} />
              <View className="ml-auto flex-row gap-2">
                {t.status === "open" ? (
                  <Pressable onPress={() => setStatus(t.id, "in_progress")} className="rounded-full bg-dime-ink px-3.5 py-1.5">
                    <Text className="text-[11px] font-bold text-white">Take</Text>
                  </Pressable>
                ) : null}
                {t.status === "in_progress" ? (
                  <Pressable onPress={() => setStatus(t.id, "resolved")} className="rounded-full bg-emerald-500 px-3.5 py-1.5">
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

function Tile({ bg, color, label, value, icon }: { bg: string; color: string; label: string; value: number; icon: string }) {
  return (
    <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: bg }}>
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={12} color={color} />
        <Text className="text-[10px] font-bold uppercase" style={{ color, letterSpacing: 0.8 }}>{label}</Text>
      </View>
      <Text className="mt-1 text-[20px] font-bold" style={{ color, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  );
}
