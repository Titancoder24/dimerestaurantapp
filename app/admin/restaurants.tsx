import { useState } from "react";
import { Image, Pressable, Text, View, FlatList } from "react-native";
import { Badge, Chip, Header, Icon, Screen, haptic } from "@/components/ui";
import { useAdminRestaurants } from "@/hooks/admin";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const statusFilters = ["all", "pending", "verified", "suspended", "banned"] as const;

export default function AdminRestaurants() {
  const qc = useQueryClient();
  const { data } = useAdminRestaurants();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");

  const filtered = (data ?? []).filter((r) => filter === "all" || r.status === filter);

  async function setStatus(id: string, status: "verified" | "suspended" | "banned") {
    await supabase.from("restaurants").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
    haptic.success();
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from("restaurants").update({ featured: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
  }

  return (
    <Screen scroll={false}>
      <Header title="Restaurants" subtitle={`${filtered.length} of ${data?.length ?? 0}`} />
      <View className="px-4">
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item} selected={filter === item} onPress={() => setFilter(item)} />}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: r }) => (
          <View className="flex-row gap-3 rounded-2xl border border-dime-border bg-white p-3">
            <Image source={{ uri: r.cover_image_url ?? "" }} className="h-16 w-16 rounded-lg" />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-[14px] font-semibold text-dime-ink">{r.name}</Text>
                <Badge tone={r.status === "verified" ? "green" : r.status === "pending" ? "orange" : "red"} label={r.status} />
              </View>
              <Text className="text-[11px] text-dime-ink-3">{r.city} • {r.cuisines.join(", ")}</Text>

              <View className="mt-2 flex-row gap-2">
                {r.status === "pending" ? (
                  <Pressable onPress={() => setStatus(r.id, "verified")} className="flex-1 items-center rounded-lg bg-emerald-500 py-1.5">
                    <Text className="text-[12px] font-semibold text-white">Approve</Text>
                  </Pressable>
                ) : null}
                {r.status === "verified" ? (
                  <Pressable onPress={() => setStatus(r.id, "suspended")} className="flex-1 items-center rounded-lg border border-amber-300 bg-white py-1.5">
                    <Text className="text-[12px] font-semibold text-amber-700">Suspend</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => toggleFeatured(r.id, r.featured)} className={`flex-1 items-center rounded-lg py-1.5 ${r.featured ? "bg-dime-orange-500" : "border border-dime-border bg-white"}`}>
                  <Text className={`text-[12px] font-semibold ${r.featured ? "text-white" : "text-dime-ink-2"}`}>{r.featured ? "Featured" : "Feature"}</Text>
                </Pressable>
                <Pressable onPress={() => setStatus(r.id, "banned")} className="flex-1 items-center rounded-lg border border-red-300 bg-white py-1.5">
                  <Text className="text-[12px] font-semibold text-dime-danger">Ban</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
