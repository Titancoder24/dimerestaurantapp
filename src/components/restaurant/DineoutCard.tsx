import { useMemo } from "react";
import { Image, Pressable, Text, View, useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { Tables } from "@/lib/supabase";
import { Icon, OfferRibbon } from "@/components/ui";
import { haptic } from "@/components/ui/haptics";
import { motion, surface } from "@/lib/visual";
import { rupees } from "@/lib/format";

type Props = {
  restaurant: Tables<"restaurants">;
};

export function DineoutCard({ restaurant }: Props) {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const cost = restaurant.cost_for_two ?? 1200;
  const distance = restaurant.distance_km;
  const cuisine = restaurant.cuisines?.slice(0, 2).join(", ") || "Multi-cuisine";
  const locality = restaurant.address?.split(",")[0]?.trim() || restaurant.city || "";

  const offers = useMemo(() => {
    const out: Array<{ tone: "green" | "blue" | "orange"; label: string }> = [];
    if (restaurant.pre_booking_discount_pct && restaurant.pre_booking_discount_pct > 0) {
      out.push({ tone: "green", label: `Flat ${restaurant.pre_booking_discount_pct}% off · +2 more` });
    } else {
      out.push({ tone: "green", label: "Flat 30% off · +2 more" });
    }
    if (restaurant.bank_offer_label) {
      out.push({ tone: "blue", label: restaurant.bank_offer_label });
    } else {
      out.push({ tone: "blue", label: "Up to 10% off bank offers" });
    }
    return out;
  }, [restaurant.pre_booking_discount_pct, restaurant.bank_offer_label]);

  const open = () => {
    haptic.light();
    router.push({ pathname: "/restaurant/[id]", params: { id: restaurant.id } });
  };

  return (
    <Animated.View style={[{ flex: 1 }, animated]}>
      <Pressable
        onPress={open}
        onPressIn={() => {
          scale.value = withTiming(0.97, motion.press);
        }}
        onPressOut={() => {
          scale.value = withTiming(1, motion.press);
        }}
      >
        <View
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
          }}
        >
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: restaurant.cover_image_url ?? "" }}
              style={{ height: 160, width: "100%" }}
            />
            <LinearGradient
              colors={["rgba(0,0,0,0)", surface.scrimBottom]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "45%",
              }}
            />
            {restaurant.featured ? (
              <View
                style={{
                  position: "absolute",
                  left: 8,
                  top: 8,
                  backgroundColor: "#FC8019",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Featured
                </Text>
              </View>
            ) : null}
            <View
              style={{
                position: "absolute",
                left: 8,
                bottom: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#16A34A",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Icon name="star.fill" size={11} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {Number(restaurant.rating ?? 0).toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={{ padding: 12, gap: 4 }}>
            <Text
              numberOfLines={1}
              className="text-dime-ink"
              style={{ fontSize: 15, fontWeight: "600" }}
            >
              {restaurant.name}
            </Text>
            <Text numberOfLines={1} className="text-dime-ink-3" style={{ fontSize: 12 }}>
              {cuisine} · {rupees(cost)} for two
            </Text>
            <Text numberOfLines={1} className="text-dime-ink-3" style={{ fontSize: 12 }}>
              {locality}
              {distance != null ? ` · ${Number(distance).toFixed(1)} km` : ""}
            </Text>

            <View style={{ marginTop: 8, gap: 6 }}>
              <OfferRibbon tone="orange" label="Table booking" />
              {offers.map((o, i) => (
                <OfferRibbon key={i} tone={o.tone} label={o.label} />
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
