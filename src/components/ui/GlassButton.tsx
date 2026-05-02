import { Pressable, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Icon } from "./Icon";
import { haptic } from "./haptics";
import { motion } from "@/lib/visual";

type Props = {
  icon: string;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassButton({ icon, onPress, size = 40, iconSize = 18, iconColor = "#1C1C1E" }: Props) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withTiming(0.92, { duration: motion.press.duration }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: motion.press.duration }); }}
      onPress={() => { haptic.light(); onPress?.(); }}
      hitSlop={8}
      style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }, aStyle]}
    >
      <BlurView intensity={40} tint="light" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.7)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.9)",
            borderRadius: size / 2,
          }}
        >
          <Icon name={icon} size={iconSize} color={iconColor} />
        </View>
      </BlurView>
    </AnimatedPressable>
  );
}
