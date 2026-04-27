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
        <View className="px-5 gap-4">
          {(data ?? []).map((r) => (
            <View
              key={r.id}
              className="rounded-2xl bg-white p-4"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-bold text-dime-ink">{r.restaurants.name}</Text>
                <Text className="text-[12px] text-dime-ink-4">{timeAgo(r.created_at)}</Text>
              </View>
              <View className="mt-2">
                <StarRating value={r.overall_rating} readOnly size={16} />
              </View>
              {r.text ? <Text className="mt-3 text-[14px] leading-[20px] text-dime-ink-2">{r.text}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
