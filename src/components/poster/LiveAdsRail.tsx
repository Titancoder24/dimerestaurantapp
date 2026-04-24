import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PosterCard } from "./PosterCard";
import { supabase, type Tables } from "@/lib/supabase";
import type { PosterStyle } from "@/poster-designer/types";

type Ad = Tables<"ads">;

/**
 * Customer-facing rail of live ads. Renders the same PosterCard the
 * owner saw in the designer — zero drift between preview and shipping.
 * Each card auto-tracks an impression on mount and a click on tap.
 */
export function LiveAdsRail({ placement = "home_banner", limit = 5 }: { placement?: Ad["placement"]; limit?: number }) {
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

  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(a) => a.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      renderItem={({ item: ad }) => {
        const style = ((ad.design_json as { style: PosterStyle })?.style) ?? defaultStyle;
        return (
          <View style={{ width: 320 }}>
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
              width={320}
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
  accent: "#FC8019", ink: "#1C1C1E", paper: "#FFFFFF",
  fontHeading: "Inter", fontWeight: "700", showImage: true,
};
