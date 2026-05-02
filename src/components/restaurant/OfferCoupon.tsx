import { Pressable, Text, View, useColorScheme } from "react-native";
import { GlowCard, GradientSurface } from "@/components/ui";
import { haptic } from "@/components/ui/haptics";
import { surface } from "@/lib/visual";

type Props = {
  headline: string;
  freebie?: string;
  windowText: string;
  metaText: string;
  ctaLabel?: string;
  onPress?: () => void;
  pageBg?: string;
};

const NOTCH = 18;

export function OfferCoupon({
  headline,
  freebie,
  windowText,
  metaText,
  ctaLabel = "Book now",
  onPress,
  pageBg,
}: Props) {
  const scheme = useColorScheme();
  const fallbackBg = scheme === "light" ? "#FFFFFF" : "#000000";
  const seamBg = pageBg ?? fallbackBg;
  const rightBg = scheme === "light" ? "#FFFFFF" : "#1C1C1E";

  return (
    <GlowCard glow="premium" style={{ borderRadius: 20 }}>
      <View
        style={{
          flexDirection: "row",
          borderRadius: 20,
          overflow: "hidden",
          minHeight: 132,
        }}
      >
        {/* Left half — premium gradient */}
        <GradientSurface
          preset="premium"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1.05, padding: 20, justifyContent: "center" }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Pre-Book Offer
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: "800",
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            {headline}
          </Text>
          {freebie ? (
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 13,
                fontWeight: "500",
                marginTop: 6,
              }}
            >
              {freebie}
            </Text>
          ) : null}
        </GradientSurface>

        {/* Seam (perforation) */}
        <View style={{ width: 1, position: "relative" }}>
          {/* Top notch */}
          <View
            style={{
              position: "absolute",
              top: -NOTCH / 2,
              left: -NOTCH / 2,
              width: NOTCH,
              height: NOTCH,
              borderRadius: NOTCH / 2,
              backgroundColor: seamBg,
            }}
          />
          {/* Bottom notch */}
          <View
            style={{
              position: "absolute",
              bottom: -NOTCH / 2,
              left: -NOTCH / 2,
              width: NOTCH,
              height: NOTCH,
              borderRadius: NOTCH / 2,
              backgroundColor: seamBg,
            }}
          />
          {/* Dashed line between notches */}
          <View
            style={{
              position: "absolute",
              top: NOTCH / 2 + 2,
              bottom: NOTCH / 2 + 2,
              left: 0,
              borderLeftWidth: 1,
              borderLeftColor: "rgba(255,255,255,0.35)",
              borderStyle: "dashed",
            }}
          />
        </View>

        {/* Right half — booking CTA */}
        <Pressable
          onPress={() => {
            haptic.light();
            onPress?.();
          }}
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: rightBg,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: scheme === "light" ? "#1C1C1E" : "#fff",
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            {windowText}
          </Text>
          <Text
            style={{
              color: scheme === "light" ? surface.hairlineLight : "rgba(255,255,255,0.7)",
              fontSize: 12,
              marginTop: 6,
              lineHeight: 16,
            }}
          >
            {metaText}
          </Text>
          <Text
            style={{
              color: "#FC8019",
              fontSize: 13,
              fontWeight: "700",
              marginTop: 10,
            }}
          >
            {ctaLabel} ›
          </Text>
        </Pressable>
      </View>
    </GlowCard>
  );
}
