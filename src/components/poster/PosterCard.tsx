import { useEffect } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { posterTemplateById } from "@/poster-designer/templates";
import type { PosterData, PosterStyle } from "@/poster-designer/types";
import { supabase } from "@/lib/supabase";

/**
 * Renders a poster from saved design data. Width is auto-derived from the
 * parent if not provided, so the same card slots into a phone home banner,
 * a tablet sidebar, or a desktop hero region without breaking.
 */
export function PosterCard({
  templateId,
  data,
  style,
  width: explicitWidth,
  onPress,
  adId,
  trackImpression = false,
}: {
  templateId: string;
  data: PosterData;
  style: PosterStyle;
  width?: number;
  onPress?: () => void;
  adId?: string;
  trackImpression?: boolean;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(explicitWidth ?? screenWidth - 32, 720);
  const template = posterTemplateById(templateId);

  useEffect(() => {
    if (trackImpression && adId) {
      void Promise.resolve(supabase.rpc("bump_ad_impression", { p_id: adId })).catch(() => {});
    }
  }, [adId, trackImpression]);

  if (!template) return null;

  function handlePress() {
    if (adId) void Promise.resolve(supabase.rpc("bump_ad_click", { p_id: adId })).catch(() => {});
    onPress?.();
  }

  const inner = <template.Render data={data} style={style} width={width} />;
  if (!onPress && !adId) return <View style={{ width }}>{inner}</View>;
  return (
    <Pressable onPress={handlePress} style={{ width }}>
      {inner}
    </Pressable>
  );
}
