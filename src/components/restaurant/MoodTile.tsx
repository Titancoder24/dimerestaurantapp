import { Image, Pressable, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, haptic } from "@/components/ui";
import { motion } from "@/lib/visual";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const palette: Record<string, { bg: string; ring: string; iconColor: string; icon: string }> = {
  quick:     { bg: "#FFF1E0", ring: "#FFD9AE", iconColor: "#9A3D00", icon: "bolt.fill" },
  date:      { bg: "#FFE6EB", ring: "#FFC2CF", iconColor: "#9C2E3D", icon: "heart.fill" },
  family:    { bg: "#E8F5E9", ring: "#C6E4CF", iconColor: "#1E5E2F", icon: "person.3.fill" },
  business:  { bg: "#E6EDF6", ring: "#C4D2E5", iconColor: "#1B3F76", icon: "briefcase.fill" },
  late:      { bg: "#EEEAF6", ring: "#D6CCE8", iconColor: "#3F2A6E", icon: "moon.fill" },
  healthy:   { bg: "#E2F2EC", ring: "#BFE0CF", iconColor: "#1E5E4A", icon: "leaf.fill" },
  celebrate: { bg: "#FFF4D5", ring: "#F5DA94", iconColor: "#7C5811", icon: "party.popper.fill" },
};

const fallback = { bg: "#F5F5F5", ring: "#E5E5E5", iconColor: "#535665", icon: "fork.knife" };

type Props = {
  moodKey: string;
  title: string;
  iconUrl?: string | null;
  onPress?: () => void;
};

export function MoodTile({ moodKey, title, iconUrl, onPress }: Props) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const c = palette[moodKey] ?? fallback;

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withTiming(motion.press.scale, { duration: motion.press.duration }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: motion.press.duration }); }}
      onPress={() => { haptic.light(); onPress?.(); }}
      style={[{ width: 84, alignItems: "center" }, aStyle]}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 22,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: c.ring,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={{ width: 48, height: 48 }} resizeMode="contain" />
        ) : (
          <Icon name={c.icon} size={28} color={c.iconColor} />
        )}
        <LinearGradient
          colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26 }}
          pointerEvents="none"
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 8,
          width: 84,
          textAlign: "center",
          fontSize: 12,
          fontWeight: "600",
          color: "#1C1C1E",
          letterSpacing: -0.1,
        }}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}
