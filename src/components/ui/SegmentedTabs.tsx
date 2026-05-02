import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { motion, brand, surface } from "@/lib/visual";
import { haptic } from "./haptics";

export type SegmentedTab = {
  key: string;
  label: string;
  badgeNode?: React.ReactNode;
};

type Props = {
  tabs: SegmentedTab[];
  active: string;
  onChange: (key: string) => void;
  scrollable?: boolean;
  variant?: "mobile" | "web";
};

type Layout = { x: number; width: number };

export function SegmentedTabs({ tabs, active, onChange, scrollable, variant = "mobile" }: Props) {
  const isScrollable = scrollable ?? tabs.length >= 4;
  const [layouts, setLayouts] = useState<Record<string, Layout>>({});
  const scrollRef = useRef<ScrollView>(null);
  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const duration = variant === "web" ? 120 : motion.snap.duration;

  useEffect(() => {
    const layout = layouts[active];
    if (!layout) return;
    left.value = withTiming(layout.x, { duration, easing: motion.snap.easing });
    width.value = withTiming(layout.width, { duration, easing: motion.snap.easing });
    if (isScrollable && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, layout.x - 40), animated: true });
    }
  }, [active, layouts, left, width, isScrollable, duration]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: left.value,
    width: width.value,
  }));

  const onTabLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const existing = prev[key];
      if (existing && existing.x === x && existing.width === w) return prev;
      return { ...prev, [key]: { x, width: w } };
    });
  };

  const padX = variant === "web" ? 24 : 16;
  const padY = variant === "web" ? 16 : 12;

  const Inner = (
    <View style={{ flexDirection: "row", position: "relative" }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable
            key={t.key}
            onLayout={onTabLayout(t.key)}
            onPress={() => {
              if (isActive) return;
              haptic.select();
              onChange(t.key);
            }}
            style={{ paddingHorizontal: padX, paddingVertical: padY, flexDirection: "row", alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isActive ? surface.ink : surface.ink3,
              }}
            >
              {t.label}
            </Text>
            {t.badgeNode ? <View style={{ marginLeft: 4 }}>{t.badgeNode}</View> : null}
          </Pressable>
        );
      })}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            height: 2,
            backgroundColor: brand.orange500,
            borderRadius: 1,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: surface.hairline, backgroundColor: "#fff" }}>
      {isScrollable ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {Inner}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 4 }}>{Inner}</View>
      )}
    </View>
  );
}
