import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Button, Chip, ChipRow, Header, Icon, Screen } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";

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

export default function Risk() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "high" | "extreme">("high");

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

  const counts = {
    extreme: (data ?? []).filter((u) => u.risk_score >= 60).length,
    high: (data ?? []).filter((u) => u.risk_score >= 30 && u.risk_score < 60).length,
    moderate: (data ?? []).filter((u) => u.risk_score < 30).length,
  };

  async function suspend(id: string) {
    await supabase.from("users").update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["risk"] });
    toast.success("User suspended");
  }

  return (
    <Screen scroll={false}>
      <Header title="Risk & Fraud" subtitle="Auto-flagged accounts by behaviour" />

      <View className="flex-row gap-2 px-5">
        <Tile color="bg-dime-danger" label="Extreme" value={counts.extreme} />
        <Tile color="bg-amber-500" label="High" value={counts.high} />
        <Tile color="bg-emerald-500" label="Moderate" value={counts.moderate} />
      </View>

      <View className="mt-4 px-5">
        <ChipRow>
          <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
          <Chip label="High +" selected={filter === "high"} onPress={() => setFilter("high")} />
          <Chip label="Extreme" selected={filter === "extreme"} onPress={() => setFilter("extreme")} />
        </ChipRow>
      </View>

      <View className="mx-5 mt-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Risk score formula</Text>
        <Text className="mt-1 text-[12px] text-dime-ink-2">
          15 pts per no-show · 5 pts per cancellation · 8 pts per open ticket. Capped at 100.
        </Text>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Icon name="checkmark.circle.fill" size={32} color="#22C55E" />
            <Text className="mt-2 text-[14px] font-bold text-dime-ink">No risky accounts</Text>
            <Text className="text-[12px] text-dime-ink-3">No-show rate and complaint volume are healthy.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/admin/users/[id]", params: { id: item.id } })}
            className="rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
          >
            <View className="flex-row items-center gap-4">
              <Avatar name={item.name ?? item.email} size={40} />
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-dime-ink">{item.name ?? "—"}</Text>
                <Text className="text-[11px] text-dime-ink-3">{item.email}</Text>
              </View>
              <View className="items-end">
                <Text className={`text-[18px] font-bold ${item.risk_score >= 60 ? "text-dime-danger" : item.risk_score >= 30 ? "text-amber-700" : "text-emerald-700"}`} style={{ letterSpacing: -0.5 }}>{item.risk_score}</Text>
                <Text className="text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>risk</Text>
              </View>
            </View>
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              <Badge tone={item.no_shows > 0 ? "red" : "gray"} label={`${item.no_shows} no-show`} />
              <Badge tone={item.cancellations > 1 ? "orange" : "gray"} label={`${item.cancellations} cancels`} />
              <Badge tone={item.tickets_open > 0 ? "red" : "gray"} label={`${item.tickets_open} open tickets`} />
              <Badge tone="gray" label={`${item.orders_count} orders`} />
              {!item.is_active ? <Badge tone="red" label="Suspended" /> : null}
            </View>
            {item.is_active && item.risk_score >= 60 ? (
              <View className="mt-4">
                <Button label="Suspend account" variant="destructive" size="sm" onPress={() => suspend(item.id)} />
              </View>
            ) : null}
          </Pressable>
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
