import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, GlowCard, GradientSurface, Icon, haptic } from "@/components/ui";
import { motion, surface } from "@/lib/visual";

type Props = {
  cashbackPct?: number;
  onCashbackPress?: () => void;
  onBookPress: () => void;
  onPayPress: () => void;
};

export function StickyPayBar({ cashbackPct = 20, onCashbackPress, onBookPress, onPayPress }: Props) {
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(80);
  const opacity = useSharedValue(0);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: opacity.value }));

  useEffect(() => {
    ty.value = withTiming(0, motion.reveal);
    opacity.value = withTiming(1, motion.reveal);
  }, [ty, opacity]);

  return (
    <Animated.View
      style={[{ position: "absolute", left: 0, right: 0, bottom: 0 }, aStyle]}
      pointerEvents="box-none"
    >
      <GlowCard glow="noir" style={{ borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "visible" }}>
        <Pressable onPress={() => { haptic.light(); onCashbackPress?.(); }}>
          <GradientSurface
            preset="noir"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              overflow: "hidden",
            }}
          >
            {/* Subtle hairline along the top */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
            {/* Tiny orange accent bar on the left */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute", left: 0, top: 12, bottom: 12, width: 3,
                backgroundColor: "#FC8019", borderTopRightRadius: 2, borderBottomRightRadius: 2,
              }}
            />
            <View
              style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: "rgba(252,128,25,0.16)",
                borderWidth: 1, borderColor: "rgba(252,128,25,0.35)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="creditcard.fill" size={14} color="#FFB56B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: "800", color: "#FFB56B", letterSpacing: 1.6 }}>
                MEMBER OFFER
              </Text>
              <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: -0.1 }}>
                Extra {cashbackPct}% cashback on your dining bill
              </Text>
            </View>
            <Icon name="chevron.right" size={13} color="rgba(255,255,255,0.65)" />
          </GradientSurface>
        </Pressable>
      </GlowCard>

      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          flexDirection: "row",
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: surface.hairline,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            label="Book a table"
            variant="secondary"
            size="md"
            className="rounded-full"
            onPress={onBookPress}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Pay bill"
            tone="contrast"
            size="md"
            className="rounded-full"
            onPress={onPayPress}
            fullWidth
          />
        </View>
      </View>
    </Animated.View>
  );
}
