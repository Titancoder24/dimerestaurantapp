import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Header, Icon, Screen, Badge } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase, type Tables } from "@/lib/supabase";
import { timeAgo } from "@/lib/format";

const rewards = [
  { title: "Free Dessert", cost: 200, icon: "birthday.cake.fill" },
  { title: "Complimentary Appetizer", cost: 150, icon: "leaf.fill" },
  { title: "Priority Booking", cost: 300, icon: "sparkles" },
  { title: "Chef's Table", cost: 1000, icon: "crown.fill" },
];

export default function Loyalty() {
  const profile = useAuth((s) => s.profile);
  const pts = profile?.loyalty_points ?? 0;
  const tier = profile?.loyalty_tier ?? "silver";

  const { data: log } = useQuery({
    queryKey: ["loyalty-log", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Tables<"loyalty_transactions">[];
    },
  });

  const tierProgress = (() => {
    if (pts >= 5000) return { nextTier: "Diamond", remaining: 0, progress: 1 };
    if (pts >= 2000) return { nextTier: "Diamond", remaining: 5000 - pts, progress: (pts - 2000) / 3000 };
    if (pts >= 500) return { nextTier: "Platinum", remaining: 2000 - pts, progress: (pts - 500) / 1500 };
    return { nextTier: "Gold", remaining: 500 - pts, progress: pts / 500 };
  })();

  return (
    <Screen>
      <Header title="Loyalty" back />

      <View className="mx-4 overflow-hidden rounded-3xl" style={{ backgroundColor: "#FC8019" }}>
        <View className="relative p-6" style={{ backgroundColor: "rgba(255,215,0,0.2)" }}>
          <Text className="text-[11px] font-bold uppercase tracking-widest text-white/90">Your points</Text>
          <Text className="mt-1 text-[44px] font-semibold text-white">{pts}</Text>
          <Badge tone="gold" label={`${tier} member`} className="mt-1 bg-white/25" />

          <View className="mt-6">
            <View className="flex-row justify-between">
              <Text className="text-[11px] uppercase tracking-widest text-white/90">
                {tierProgress.remaining > 0 ? `${tierProgress.remaining} to ${tierProgress.nextTier}` : "Top tier"}
              </Text>
            </View>
            <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
              <View className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, tierProgress.progress * 100)}%` }} />
            </View>
          </View>
        </View>
      </View>

      <View className="mt-6 px-4">
        <Text className="text-[17px] font-semibold text-dime-ink">Rewards store</Text>
        <View className="mt-3 gap-2">
          {rewards.map((r) => {
            const canRedeem = pts >= r.cost;
            return (
              <View key={r.title} className="flex-row items-center gap-3 rounded-2xl border border-dime-border bg-white p-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-dime-orange-50">
                  <Icon name={r.icon} size={18} color="#FC8019" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-dime-ink">{r.title}</Text>
                  <Text className="text-[12px] text-dime-ink-3">{r.cost} points</Text>
                </View>
                <Text className={`text-[13px] font-semibold ${canRedeem ? "text-dime-orange-600" : "text-dime-ink-3"}`}>
                  {canRedeem ? "Redeem" : "Locked"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="mt-6 px-4">
        <Text className="text-[17px] font-semibold text-dime-ink">Points history</Text>
        <View className="mt-2 overflow-hidden rounded-2xl border border-dime-border bg-white">
          {(log ?? []).map((l, idx) => (
            <View key={l.id} className={`flex-row items-center gap-3 p-3 ${idx > 0 ? "border-t border-dime-border" : ""}`}>
              <View className={`h-8 w-8 items-center justify-center rounded-full ${l.points > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <Icon name={l.points > 0 ? "plus" : "minus"} size={14} color={l.points > 0 ? "#22C55E" : "#EF4444"} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] text-dime-ink">{l.description ?? l.type}</Text>
                <Text className="text-[11px] text-dime-ink-3">{timeAgo(l.created_at)}</Text>
              </View>
              <Text className={`text-[14px] font-semibold ${l.points > 0 ? "text-emerald-600" : "text-dime-danger"}`}>
                {l.points > 0 ? "+" : ""}{l.points}
              </Text>
            </View>
          ))}
          {(log ?? []).length === 0 ? (
            <View className="items-center p-6">
              <Text className="text-[13px] text-dime-ink-3">No transactions yet.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
