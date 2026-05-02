import { useState } from "react";
import { Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { Icon } from "@/components/ui";
import { haptic } from "@/components/ui/haptics";
import { motion, surface } from "@/lib/visual";
import { useToast } from "@/store/toast";

const SUGGESTIONS = [
  "Curate a date-night meal plan",
  "Must-have desserts",
  "Light healthy meals for dinner",
  "Any special drinks",
];

function AISparkle({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Defs>
        <LinearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFB56B" />
          <Stop offset="50%" stopColor="#FE9C3F" />
          <Stop offset="100%" stopColor="#FC8019" />
        </LinearGradient>
      </Defs>
      <Path
        d="M10 1 L11.6 7.4 L18 9 L11.6 10.6 L10 17 L8.4 10.6 L2 9 L8.4 7.4 Z"
        fill="url(#aiGrad)"
      />
      <Path d="M16 2 L16.6 4 L18.6 4.6 L16.6 5.2 L16 7.2 L15.4 5.2 L13.4 4.6 L15.4 4 Z" fill="url(#aiGrad)" />
    </Svg>
  );
}

export function AskAnythingPanel() {
  const [value, setValue] = useState("");
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const toast = useToast((s) => s);

  const sparkleScale = useSharedValue(1);
  const sparkleStyle = useAnimatedStyle(() => ({ transform: [{ scale: sparkleScale.value }] }));

  const enabled = value.trim().length >= 3;

  const submit = () => {
    if (!enabled) return;
    haptic.success();
    sparkleScale.value = withSequence(
      withTiming(1.15, motion.snap),
      withTiming(1, motion.snap)
    );
    toast.info("Coming soon", "AI answers ship in the next release.");
    setValue("");
  };

  const onSparkleTap = () => {
    sparkleScale.value = withSequence(
      withTiming(1.15, motion.snap),
      withTiming(1, motion.snap)
    );
  };

  return (
    <View>
      <View
        style={{
          height: 56,
          borderRadius: 999,
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          gap: 10,
        }}
      >
        <Pressable onPress={onSparkleTap} hitSlop={8}>
          <Animated.View style={sparkleStyle}>
            <AISparkle size={20} />
          </Animated.View>
        </Pressable>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="What would you like to know?"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.45)" : "rgba(60,60,67,0.45)"}
          style={{
            flex: 1,
            color: isDark ? "#fff" : "#1C1C1E",
            fontSize: 14,
          }}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable
          onPress={submit}
          disabled={!enabled}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: enabled ? "#FC8019" : "rgba(255,255,255,0.08)",
            opacity: enabled ? 1 : 0.6,
          }}
        >
          <Icon name="arrow.right" size={16} color="#fff" />
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 14,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              haptic.select();
              setValue(s);
            }}
            style={{
              flexBasis: "48%",
              flexGrow: 1,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                flex: 1,
                color: isDark ? "#fff" : "#1C1C1E",
                fontSize: 13,
                fontWeight: "500",
              }}
              numberOfLines={2}
            >
              {s}
            </Text>
            <Icon
              name="arrow.up.right"
              size={12}
              color={isDark ? "rgba(255,255,255,0.6)" : "rgba(60,60,67,0.6)"}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export { AISparkle };
