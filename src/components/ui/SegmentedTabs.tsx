import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion, surface } from "@/lib/visual";
import { haptic } from "./haptics";
import { cn } from "@/lib/cn";

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
  className?: string;
};

type Geom = { x: number; width: number };

export function SegmentedTabs({ tabs, active, onChange, scrollable, className }: Props) {
  const isScrollable = scrollable ?? tabs.length >= 4;
  const scheme = useColorScheme();
  const hairline = scheme === "light" ? surface.hairlineLight : surface.hairlineDark;

  const [geoms, setGeoms] = useState<Record<string, Geom>>({});
  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const scrollerRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const g = geoms[active];
    if (!g) return;
    left.value = withTiming(g.x, motion.snap);
    width.value = withTiming(g.width, motion.snap);
    if (isScrollable && scrollerRef.current) {
      scrollerRef.current.scrollTo({ x: Math.max(0, g.x - 24), animated: true });
    }
  }, [active, geoms, isScrollable, left, width]);

  const indicator = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: left.value }],
  }));

  const onTabLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setGeoms((prev) => {
      const next = { ...prev, [key]: { x, width: w } };
      if (key === active) {
        left.value = withTiming(x, motion.snap);
        width.value = withTiming(w, motion.snap);
      }
      return next;
    });
  };

  const Bar = (
    <View className="relative">
      <View
        className={cn("flex-row", isScrollable ? "" : "")}
        style={{ minWidth: "100%" }}
      >
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                haptic.select();
                onChange(t.key);
              }}
              onLayout={onTabLayout(t.key)}
              className="px-4 py-3"
            >
              <View className="flex-row items-center gap-1">
                <Text
                  className={cn(
                    "text-[14px]",
                    isActive ? "text-dime-ink font-semibold" : "text-dime-ink-3 font-medium"
                  )}
                >
                  {t.label}
                </Text>
                {t.badgeNode ? <View className="ml-1">{t.badgeNode}</View> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View
        pointerEvents="none"
        style={{
          height: 1,
          backgroundColor: hairline,
          width: "100%",
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: 0,
            height: 2,
            backgroundColor: "#FC8019",
            borderRadius: 1,
          },
          indicator,
        ]}
      />
    </View>
  );

  if (isScrollable) {
    return (
      <ScrollView
        ref={scrollerRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className={cn(className)}
      >
        {Bar}
      </ScrollView>
    );
  }
  return <View className={cn(className)}>{Bar}</View>;
}
