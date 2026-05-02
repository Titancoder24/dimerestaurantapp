import { Image, Pressable, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Icon, haptic } from "@/components/ui";
import { motion, surface } from "@/lib/visual";
import type { DineoutRestaurant } from "@/hooks/queries";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  restaurant: DineoutRestaurant;
  eyebrow?: string;
};

export function HeroRestaurantCard({ restaurant: r, eyebrow }: Props) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const ratingNum = Number(r.rating);
  const cost = r.cost_for_two ?? 1200;
  const distance = r.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : null;
  const cashbackPct = r.cashback_pct ?? null;

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withTiming(motion.press.scale, { duration: motion.press.duration }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: motion.press.duration }); }}
      onPress={() => {
        haptic.light();
        router.push({ pathname: "/restaurant/[id]", params: { id: r.id } });
      }}
      style={[
        {
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: surface.hairline,
        },
        aStyle,
      ]}
    >
      <View style={{ position: "relative", height: 220 }}>
        <Image
          source={{ uri: r.cover_image_url ?? "" }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Top scrim for top-row chips */}
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 80 }}
          pointerEvents="none"
        />
        {/* Bottom scrim for caption */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 140 }}
          pointerEvents="none"
        />

        {/* Eyebrow + rating chip on top */}
        <View style={{ position: "absolute", top: 14, left: 14, right: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {eyebrow ? (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.94)",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#1C1C1E", letterSpacing: 1.4 }}>
                {eyebrow}
              </Text>
            </View>
          ) : <View />}
          {ratingNum > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: "#1E7A3A",
              }}
            >
              <Icon name="star.fill" size={11} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>{ratingNum.toFixed(1)}</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600" }}>
                ({r.review_count ?? 0})
              </Text>
            </View>
          ) : null}
        </View>

        {/* Caption block */}
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: -0.6,
            }}
          >
            {r.name}
          </Text>
          <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <Text numberOfLines={1} style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>
              {r.cuisines.slice(0, 3).join(" · ")}
            </Text>
          </View>
          <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>
              ₹{cost} for two
            </Text>
            {distance ? (
              <>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.5)" }} />
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>{distance}</Text>
              </>
            ) : null}
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.5)" }} />
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>{r.city}</Text>
          </View>
        </View>
      </View>

      {/* Footer offer strip — noir with orange accent */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 11,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: "#0E0D0C",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute", left: 0, top: 8, bottom: 8, width: 3,
            backgroundColor: "#FC8019", borderTopRightRadius: 2, borderBottomRightRadius: 2,
          }}
        />
        <View
          style={{
            width: 26, height: 26, borderRadius: 8,
            backgroundColor: "rgba(252,128,25,0.16)",
            borderWidth: 1, borderColor: "rgba(252,128,25,0.4)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="bolt.fill" size={10} color="#FFB56B" />
        </View>
        <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: "#fff", letterSpacing: -0.1 }}>
          {cashbackPct ? `Up to ${cashbackPct}% cashback` : "Curated dining experience"}
          <Text style={{ fontWeight: "500", color: "rgba(255,255,255,0.6)" }}> · pre-book to save more</Text>
        </Text>
        <Icon name="chevron.right" size={12} color="rgba(255,255,255,0.65)" />
      </View>
    </AnimatedPressable>
  );
}
