import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar, Badge, Chip, Icon, Input, Screen } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { fullDate, time12 } from "@/lib/format";

const filters = ["all", "today", "upcoming", "past"] as const;
const statusFilters = ["all", "pending", "confirmed", "arrived", "cancelled", "no_show", "completed"] as const;

type Row = Tables<"bookings"> & {
  users: { id: string; name: string | null; email: string } | null;
  restaurants: { name: string | null } | null;
};

export default function AdminBookings() {
  const router = useRouter();
  const [when, setWhen] = useState<(typeof filters)[number]>("today");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");
  const [query, setQuery] = useState("");

  const { data } = useQuery({
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

  const filtered = (data ?? []).filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (query) {
      const hay = `${b.users?.name ?? ""} ${b.users?.email ?? ""} ${b.restaurants?.name ?? ""}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <Screen scroll={false} className="bg-neutral-50">
      <View className="bg-white px-6 pb-4 pt-5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }}>
        <View className="mb-1">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>Bookings</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Platform Bookings</Text>
            <Text className="text-[13px] text-dime-ink-4">{filtered.length} of {data?.length ?? 0}</Text>
          </View>
        </View>

        <View className="mt-3">
          <Input value={query} onChangeText={setQuery} placeholder="Search customer, restaurant..." leading={<Icon name="magnifyingglass" size={15} color="#A3A3A3" />} />
        </View>

        <View className="mt-3">
          <FlatList
            horizontal
            data={filters}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => <Chip label={item} selected={when === item} onPress={() => setWhen(item)} />}
          />
        </View>
        <View className="mt-2">
          <FlatList
            horizontal
            data={statusFilters}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => <Chip label={item.replace("_", " ")} selected={status === item} onPress={() => setStatus(item)} />}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: b }) => (
          <Pressable
            onPress={() => b.users?.id && router.push({ pathname: "/admin/users/[id]", params: { id: b.users.id } })}
            className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
          >
            <Avatar name={b.users?.name ?? "Walk-in"} size={38} />
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{b.users?.name ?? "Walk-in"}</Text>
              <Text className="mt-0.5 text-[12px] text-dime-ink-3">{b.restaurants?.name ?? "—"} · {fullDate(b.date)} · {time12(b.time)}</Text>
              <Text className="text-[11px] text-dime-ink-4">{b.guests} guests · {b.seating_preference}</Text>
            </View>
            <Badge tone={
              b.status === "confirmed" || b.status === "arrived" || b.status === "completed" ? "green" :
              b.status === "cancelled" || b.status === "no_show" ? "red" : "orange"
            } label={b.status.replace("_", " ")} />
          </Pressable>
        )}
        ListEmptyComponent={<Text className="px-5 py-16 text-center text-[13px] text-dime-ink-4">No bookings match your filters.</Text>}
      />
    </Screen>
  );
}
