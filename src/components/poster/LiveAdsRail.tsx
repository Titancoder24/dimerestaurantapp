import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PosterCard } from "./PosterCard";
import { supabase, type Tables } from "@/lib/supabase";
import type { PosterStyle } from "@/poster-designer/types";

type Ad = Tables<"ads">;

export function LiveAdsRail({
  placement = "home_banner",
  limit = 5,
  mobileWidth,
}: {
  placement?: Ad["placement"];
  limit?: number;
  mobileWidth?: number;
}) {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["live-ads", placement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_ads")
        .select("*")
        .eq("placement", placement)
        .limit(limit);
      if (error) throw error;
      return data as Ad[];
    },
  });

  if (!data || data.length === 0) return null;

  const cardWidth = mobileWidth ?? 320;

  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(a) => a.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      snapToInterval={cardWidth + 12}
      decelerationRate="fast"
      renderItem={({ item: ad }) => {
        const style = ((ad.design_json as { style: PosterStyle })?.style) ?? defaultStyle;
        return (
          <View style={{ width: cardWidth }}>
            <PosterCard
              templateId={ad.template_id}
              data={{
                title: ad.title,
                subtitle: ad.subtitle,
                body: ad.body,
                ctaText: ad.cta_text,
                imageUrl: ad.image_url,
              }}
              style={style}
              width={cardWidth}
              adId={ad.id}
              trackImpression
              onPress={() => {
                if (ad.cta_link) router.push(ad.cta_link as never);
              }}
            />
          </View>
        );
      }}
    />
  );
}

const defaultStyle: PosterStyle = {
  accent: "#FF6B2C", ink: "#1C1C1E", paper: "#FFFFFF",
  fontHeading: "Inter", fontWeight: "700", showImage: true,
};
