import { Pressable, Text, View } from "react-native";
import { GlowCard, GradientSurface, Icon, haptic } from "@/components/ui";

type Props = {
  title: string;
  subtitle?: string;
  slotInfo?: string;
  slotMeta?: string;
  onBookPress?: () => void;
};

export function OfferCoupon({
  title,
  subtitle,
  slotInfo = "From 7:45 PM, today",
  slotMeta = "19 slots left · Cover charge ₹25",
  onBookPress,
}: Props) {
  return (
    <Pressable onPress={() => { haptic.light(); onBookPress?.(); }}>
      <GlowCard glow="noir" style={{ borderRadius: 24 }}>
        <GradientSurface
          preset="noir"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            overflow: "hidden",
            paddingHorizontal: 22,
            paddingTop: 22,
            paddingBottom: 18,
          }}
        >
          {/* Eyebrow row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "rgba(252,128,25,0.14)",
                borderWidth: 1,
                borderColor: "rgba(252,128,25,0.4)",
              }}
            >
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#FC8019" }} />
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFB56B", letterSpacing: 1.4 }}>
                LIVE · TONIGHT
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.55)", letterSpacing: -0.1 }}>
              {slotInfo}
            </Text>
          </View>

          {/* Headline */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 36,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: -1.4,
              lineHeight: 40,
            }}
          >
            {title.toLowerCase().replace(/^./, (c) => c.toUpperCase())}
          </Text>
          {subtitle ? (
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: "500",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: -0.1,
              }}
            >
              {subtitle}
            </Text>
          ) : null}

          {/* Hairline */}
          <View
            style={{
              marginTop: 20,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />

          {/* Footer row */}
          <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "500", letterSpacing: -0.1 }}>
              {slotMeta}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingLeft: 14,
                paddingRight: 4,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "#FC8019",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff", letterSpacing: 0.2 }}>
                Book now
              </Text>
              <View
                style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="arrow.right" size={11} color="#fff" />
              </View>
            </View>
          </View>
        </GradientSurface>
      </GlowCard>
    </Pressable>
  );
}
