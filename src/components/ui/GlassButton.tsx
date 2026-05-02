import { Platform, Pressable, View, type PressableProps } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "./Icon";
import { haptic } from "./haptics";
import { motion, surface } from "@/lib/visual";
import { cn } from "@/lib/cn";

type Props = Omit<PressableProps, "children"> & {
  icon: string;
  iconSize?: number;
  iconColor?: string;
  size?: number;
  className?: string;
  intensity?: number;
};

export function GlassButton({
  icon,
  iconSize = 18,
  iconColor = "#fff",
  size = 40,
  className,
  intensity = 20,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animated}>
      <Pressable
        hitSlop={8}
        onPressIn={() => {
          scale.value = withTiming(0.92, motion.press);
        }}
        onPressOut={() => {
          scale.value = withTiming(1, motion.press);
        }}
        onPress={(e) => {
          haptic.light();
          onPress?.(e);
        }}
        className={cn("overflow-hidden", className)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        {...rest}
      >
        {Platform.OS === "web" ? (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: surface.glassButtonTint,
            }}
          />
        ) : (
          <BlurView
            intensity={intensity}
            tint="dark"
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: surface.glassButtonTint,
            }}
          />
        )}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: surface.glassRim,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={iconSize} color={iconColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
