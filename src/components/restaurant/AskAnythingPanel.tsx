import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import { Icon, haptic } from "@/components/ui";
import { useToast } from "@/store/toast";
import { motion, brand, surface } from "@/lib/visual";

const SUGGESTIONS = [
  "Curate a date-night meal plan",
  "Must-have desserts",
  "Light healthy meals for dinner",
  "Any special drinks",
];

function AISparkle({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Defs>
        <SvgGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brand.orange300} />
          <Stop offset="0.5" stopColor={brand.orange400} />
          <Stop offset="1" stopColor={brand.orange500} />
        </SvgGradient>
      </Defs>
      <Path d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z" fill="url(#aiGrad)" />
    </Svg>
  );
}

export function PulsingSparkle({ size = 20 }: { size?: number }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pulse = () => {
    scale.value = withSequence(
      withTiming(1.15, { duration: motion.snap.duration }),
      withTiming(1, { duration: motion.snap.duration }),
    );
  };
  return (
    <Pressable onPress={() => { pulse(); haptic.light(); }}>
      <Animated.View style={aStyle}>
        <AISparkle size={size} />
      </Animated.View>
    </Pressable>
  );
}

export function AskAnythingPanel() {
  const [value, setValue] = useState("");
  const toast = useToast();

  const canSubmit = value.trim().length >= 3;

  const submit = () => {
    if (!canSubmit) return;
    haptic.success();
    toast.success("Coming soon", "We'll soon answer your dining questions with AI.");
    setValue("");
  };

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {/* Pill input */}
      <View
        style={{
          height: 56,
          borderRadius: 999,
          backgroundColor: "#FFF8F1",
          borderWidth: 1,
          borderColor: "#FFE0BF",
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 8,
          gap: 10,
        }}
      >
        <AISparkle size={20} />
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="What would you like to know?"
          placeholderTextColor={surface.ink3}
          style={{ flex: 1, fontSize: 14, color: surface.ink }}
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          style={{
            height: 36,
            width: 36,
            borderRadius: 18,
            backgroundColor: canSubmit ? "#FC8019" : "#F2F2F2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="arrow.right" size={14} color={canSubmit ? "#fff" : surface.ink3} />
        </Pressable>
      </View>

      {/* Suggestion chips */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => { haptic.select(); setValue(s); }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#fff",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: surface.hairline,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "500", color: surface.ink }}>{s}</Text>
            <Icon name="arrow.up.right" size={11} color={surface.ink3} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
