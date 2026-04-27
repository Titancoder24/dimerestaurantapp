import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar, Badge, Chip, Header, Icon, Input, Screen } from "@/components/ui";
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
    <Screen scroll={false}>
      <Header title="Platform bookings" subtitle={`${filtered.length} of ${data?.length ?? 0}`} />

      <View className="px-5">
        <Input value={query} onChangeText={setQuery} placeholder="Customer, restaurant..." leading={<Icon name="magnifyingglass" size={16} color="#8A8A8A" />} />
      </View>

      <View className="mt-4 px-5">
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item} selected={when === item} onPress={() => setWhen(item)} />}
        />
      </View>

      <View className="mt-2 px-5">
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item.replace("_", " ")} selected={status === item} onPress={() => setStatus(item)} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: b }) => (
          <Pressable
            onPress={() => b.users?.id && router.push({ pathname: "/admin/users/[id]", params: { id: b.users.id } })}
            className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
          >
            <Avatar name={b.users?.name ?? "Walk-in"} size={36} />
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-dime-ink">{b.users?.name ?? "Walk-in"}</Text>
              <Text className="text-[11px] text-dime-ink-3">{b.restaurants?.name ?? "—"} · {fullDate(b.date)} · {time12(b.time)}</Text>
              <Text className="text-[11px] text-dime-ink-3">{b.guests} guests · {b.seating_preference}</Text>
            </View>
            <Badge tone={
              b.status === "confirmed" || b.status === "arrived" || b.status === "completed" ? "green" :
              b.status === "cancelled" || b.status === "no_show" ? "red" : "orange"
            } label={b.status.replace("_", " ")} />
          </Pressable>
        )}
        ListEmptyComponent={<Text className="px-5 py-12 text-center text-[13px] text-dime-ink-3">No bookings match.</Text>}
      />
    </Screen>
  );
}
