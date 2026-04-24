import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Header, Icon, Screen } from "@/components/ui";
import { PosterCard } from "@/components/poster/PosterCard";
import { supabase, type Tables } from "@/lib/supabase";
import { useOwnedRestaurant } from "@/hooks/owner";
import { rupees, timeAgo } from "@/lib/format";

type Ad = Tables<"ads">;

export default function OwnerAds() {
  const router = useRouter();
  const { data: restaurant } = useOwnedRestaurant();

  const { data: ads } = useQuery({
    queryKey: ["owner-ads", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("restaurant_id", restaurant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
  });

  const list = ads ?? [];
  const totals = list.reduce(
    (a, ad) => ({
      impressions: a.impressions + ad.impressions,
      clicks: a.clicks + ad.clicks,
      spend: a.spend + (ad.status === "active" || ad.status === "completed" ? Number(ad.total_cost) : 0),
    }),
    { impressions: 0, clicks: 0, spend: 0 }
  );

  return (
    <Screen scroll={false}>
      <Header
        title="Ads"
        subtitle={restaurant?.name}
        right={
          <Pressable
            onPress={() => router.push("/owner/ads/new")}
            className="rounded-full bg-dime-orange-500 px-3 py-1.5"
          >
            <Text className="text-[12px] font-semibold text-white">+ Create ad</Text>
          </Pressable>
        }
      />

      <View className="flex-row gap-2 px-4">
        <Tile color="bg-dime-orange-500" label="Impressions" value={totals.impressions.toLocaleString()} />
        <Tile color="bg-emerald-500" label="Clicks" value={totals.clicks.toLocaleString()} />
        <Tile color="bg-blue-500" label="Spend" value={rupees(totals.spend)} />
      </View>

      <FlatList
        data={list}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="sparkles" size={32} color="#C7C7CC" />
            <Text className="mt-3 text-[16px] font-semibold text-dime-ink">No ads yet</Text>
            <Text className="mt-1 max-w-[300px] text-center text-[13px] text-dime-ink-3">
              Promote your restaurant on the home feed. Start at ₹100/day, pick how many days, and we'll review within 24 hours.
            </Text>
            <View className="mt-5">
              <Button label="Create your first ad" onPress={() => router.push("/owner/ads/new")} />
            </View>
          </View>
        }
        renderItem={({ item: ad }) => (
          <Pressable className="rounded-2xl border border-dime-border bg-white p-3">
            <PosterCard
              templateId={ad.template_id}
              data={{ title: ad.title, subtitle: ad.subtitle, body: ad.body, ctaText: ad.cta_text, imageUrl: ad.image_url }}
              style={(ad.design_json as { style: import("@/poster-designer/types").PosterStyle }).style ?? defaultPreviewStyle}
            />
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="flex-1 text-[15px] font-semibold text-dime-ink" numberOfLines={1}>{ad.title}</Text>
              <StatusBadge status={ad.status} />
            </View>
            <View className="mt-2 flex-row items-center gap-2">
              <Badge tone="orange" label={`${rupees(ad.daily_budget)} / day`} />
              <Badge tone="gray" label={`${ad.duration_days} days`} />
              <Badge tone="green" label={`Total ${rupees(Number(ad.total_cost))}`} />
            </View>
            <View className="mt-2 flex-row items-center gap-3">
              <Text className="text-[12px] text-dime-ink-2">👁 {ad.impressions.toLocaleString()}</Text>
              <Text className="text-[12px] text-dime-ink-2">↗ {ad.clicks.toLocaleString()}</Text>
              <Text className="ml-auto text-[11px] text-dime-ink-3">{timeAgo(ad.created_at)}</Text>
            </View>
            {ad.status === "rejected" && ad.admin_notes ? (
              <View className="mt-2 rounded-md bg-red-50 p-2">
                <Text className="text-[11px] font-semibold text-dime-danger">Rejected</Text>
                <Text className="text-[12px] text-red-900">{ad.admin_notes}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const defaultPreviewStyle: import("@/poster-designer/types").PosterStyle = {
  accent: "#FC8019", ink: "#1C1C1E", paper: "#FFFFFF",
  fontHeading: "Inter", fontWeight: "700", showImage: true,
};

function StatusBadge({ status }: { status: Ad["status"] }) {
  const tone = ({
    draft: "gray", pending_review: "orange", approved: "blue",
    active: "green", paused: "gray", completed: "gray", rejected: "red",
  } as const)[status];
  return <Badge tone={tone} label={status.replace("_", " ")} />;
}

function Tile({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} py-3`}>
      <Text className="text-[18px] font-bold text-white" numberOfLines={1}>{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/90">{label}</Text>
    </View>
  );
}
