import { Image, Pressable, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Icon, OfferRibbon, haptic } from "@/components/ui";
import { motion, surface, glow } from "@/lib/visual";
import type { DineoutRestaurant } from "@/hooks/queries";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  restaurant: DineoutRestaurant;
  variant?: "mobile" | "web";
};

export function DineoutCard({ restaurant: r, variant = "mobile" }: Props) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const ratingNum = Number(r.rating);
  const distance = r.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : null;
  const cost = r.cost_for_two ?? 1200;
  const preBooking = r.pre_booking_discount_pct ?? null;
  const isWeb = variant === "web";
  const heroH = isWeb ? 140 : 160;

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
          borderRadius: isWeb ? 14 : 18,
          overflow: "hidden",
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: surface.hairline,
        },
        isWeb ? glow.webCard : null,
        aStyle,
      ]}
    >
      <View style={{ position: "relative" }}>
        <Image source={{ uri: r.cover_image_url ?? "" }} style={{ width: "100%", height: heroH }} resizeMode="cover" />

        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60 }}
          pointerEvents="none"
        />

        {r.featured ? (
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "#FC8019",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>FEATURED</Text>
          </View>
        ) : null}

        {/* On mobile, rating chip overlays the image. On web, it moves
            inline next to the name in the body (Swiggy reference). */}
        {!isWeb && ratingNum > 0 ? (
          <View
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#1E7A3A",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Icon name="star.fill" size={10} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{ratingNum.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 12, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: "700",
              color: surface.ink,
              letterSpacing: -0.2,
            }}
          >
            {r.name}
          </Text>
          {isWeb && ratingNum > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: "#1E7A3A",
                borderRadius: 5,
                paddingHorizontal: 6,
                paddingVertical: 3,
              }}
            >
              <Icon name="star.fill" size={9} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{ratingNum.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 11, color: surface.ink3 }}>
          {r.cuisines.slice(0, 2).join(", ")} · ₹{cost} for two
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 11, color: surface.ink3 }}>
          {r.city}{distance ? ` · ${distance}` : ""}
        </Text>

        <View style={{ marginTop: 6, gap: 6 }}>
          <OfferRibbon icon="tag.fill" tone="orange" label="Table booking" />
          {preBooking ? (
            <OfferRibbon icon="bolt.fill" tone="green" label={`Flat ${preBooking}% off · pre-book`} />
          ) : (
            <OfferRibbon icon="bolt.fill" tone="green" label="Flat 30% off · +2 more" />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}
