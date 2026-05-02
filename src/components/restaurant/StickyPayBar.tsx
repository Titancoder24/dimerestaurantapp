import { useEffect } from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Button, GlowCard, GradientSurface, Icon } from "@/components/ui";
import { haptic } from "@/components/ui/haptics";
import { motion, surface } from "@/lib/visual";

type Props = {
  cashbackPct: number;
  onBook: () => void;
  onPay: () => void;
  onCashbackPress?: () => void;
};

export function StickyPayBar({ cashbackPct, onBook, onPay, onCashbackPress }: Props) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const translate = useSharedValue(80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translate.value = withTiming(0, motion.reveal);
    opacity.value = withTiming(1, motion.reveal);
  }, [opacity, translate]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        animated,
      ]}
      pointerEvents="box-none"
    >
      {/* Cashback ribbon */}
      <GlowCard glow="premium" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "visible" }}>
        <Pressable
          onPress={() => {
            haptic.light();
            onCashbackPress?.();
          }}
        >
          <GradientSurface
            preset="premium"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              gap: 10,
            }}
          >
            <Icon name="sparkles" size={16} color="#fff" />
            <Text style={{ flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" }}>
              Extra {cashbackPct}% cashback on your dining bill
            </Text>
            <Icon name="chevron.right" size={14} color="rgba(255,255,255,0.85)" />
          </GradientSurface>
        </Pressable>
      </GlowCard>

      {/* Action bar */}
      <View
        style={{
          backgroundColor: isDark ? "#000000" : "#FFFFFF",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: isDark ? surface.hairlineDark : surface.hairlineLight,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            label="Book a table"
            variant="ghost"
            fullWidth
            className="rounded-full border border-white/20 dark:border-white/20"
            onPress={() => {
              haptic.light();
              onBook();
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Pay bill"
            tone="contrast"
            fullWidth
            className="rounded-full"
            onPress={() => {
              haptic.light();
              onPay();
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}
