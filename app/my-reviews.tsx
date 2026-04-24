import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, Header, Icon, Screen, StarRating } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { timeAgo } from "@/lib/format";

export default function MyReviews() {
  const profile = useAuth((s) => s.profile);
  const { data } = useQuery({
    queryKey: ["my-reviews", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, restaurants(name, cover_image_url)")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; overall_rating: number; text: string | null; created_at: string; restaurants: { name: string } }[];
    },
  });

  return (
    <Screen>
      <Header title="My Reviews" back />
      {(data ?? []).length === 0 ? (
        <EmptyState icon="star.fill" title="No reviews yet" message="After your first visit, you can rate your experience here." />
      ) : (
        <View className="px-4 gap-3">
          {(data ?? []).map((r) => (
            <View key={r.id} className="rounded-2xl border border-dime-border bg-white p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-dime-ink">{r.restaurants.name}</Text>
                <Text className="text-[11px] text-dime-ink-3">{timeAgo(r.created_at)}</Text>
              </View>
              <View className="mt-2">
                <StarRating value={r.overall_rating} readOnly size={16} />
              </View>
              {r.text ? <Text className="mt-2 text-[13px] text-dime-ink-2">{r.text}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
