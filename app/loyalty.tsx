import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

      <View className="mx-5 overflow-hidden rounded-[22px]" style={{ shadowColor: "#C9A96E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}>
        <LinearGradient
          colors={["#1A1A1A", "#2D2D2D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6"
        >
          <Text className="text-[10px] font-bold uppercase text-dime-gold" style={{ letterSpacing: 2 }}>
            Your points
          </Text>
          <Text className="mt-2 text-[48px] font-bold text-white" style={{ letterSpacing: -2 }}>{pts}</Text>
          <View className="mt-1.5 self-start rounded-full bg-white/10 px-3 py-1">
            <Text className="text-[10px] font-bold uppercase text-dime-gold-light" style={{ letterSpacing: 1 }}>
              {tier} member
            </Text>
          </View>

          <View className="mt-6">
            <Text className="text-[11px] text-white/50">
              {tierProgress.remaining > 0 ? `${tierProgress.remaining} points to ${tierProgress.nextTier}` : "You've reached the top!"}
            </Text>
            <View className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <View className="h-full rounded-full bg-dime-gold" style={{ width: `${Math.min(100, Math.max(4, tierProgress.progress * 100))}%` }} />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View className="mt-8 px-5">
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
          Rewards Store
        </Text>
        <View className="mt-3 gap-3">
          {rewards.map((r) => {
            const canRedeem = pts >= r.cost;
            return (
              <View
                key={r.title}
                className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-dime-primary-50">
                  <Icon name={r.icon} size={20} color="#FF6B2C" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-dime-ink">{r.title}</Text>
                  <Text className="mt-0.5 text-[13px] text-dime-ink-3">{r.cost} points</Text>
                </View>
                <Text className={`text-[13px] font-bold ${canRedeem ? "text-dime-primary-500" : "text-dime-ink-4"}`}>
                  {canRedeem ? "Redeem" : "Locked"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className="mt-8 px-5">
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
          Points History
        </Text>
        <View className="mt-3 overflow-hidden rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          {(log ?? []).map((l, idx) => (
            <View key={l.id} className={`flex-row items-center gap-4 px-4 py-3.5 ${idx > 0 ? "border-t border-neutral-50" : ""}`}>
              <View className={`h-9 w-9 items-center justify-center rounded-xl ${l.points > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <Icon name={l.points > 0 ? "plus" : "minus"} size={14} color={l.points > 0 ? "#16A34A" : "#EF4444"} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-medium text-dime-ink">{l.description ?? l.type}</Text>
                <Text className="text-[12px] text-dime-ink-4">{timeAgo(l.created_at)}</Text>
              </View>
              <Text className={`text-[15px] font-bold ${l.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {l.points > 0 ? "+" : ""}{l.points}
              </Text>
            </View>
          ))}
          {(log ?? []).length === 0 ? (
            <View className="items-center p-8">
              <Text className="text-[14px] text-dime-ink-3">No transactions yet.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
