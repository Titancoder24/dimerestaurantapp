import { Pressable, Text, View } from "react-native";
import { Icon } from "./Icon";
import { haptic } from "./haptics";
import { cn } from "@/lib/cn";

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8" : size === "lg" ? "h-12" : "h-10";
  const btn = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-[14px]" : "text-[16px]";
  return (
    <View className={cn("flex-row items-center rounded-full border border-dime-orange-500 bg-dime-orange-500", dim)}>
      <Pressable
        disabled={value <= min}
        onPress={() => {
          haptic.light();
          onChange(Math.max(min, value - 1));
        }}
        className={cn("items-center justify-center rounded-full", btn, value <= min && "opacity-50")}
      >
        <Icon name="minus" size={16} color="#fff" />
      </Pressable>
      <Text className={cn("min-w-[24px] text-center font-semibold text-white", text)}>{value}</Text>
      <Pressable
        disabled={value >= max}
        onPress={() => {
          haptic.light();
          onChange(Math.min(max, value + 1));
        }}
        className={cn("items-center justify-center rounded-full", btn, value >= max && "opacity-50")}
      >
        <Icon name="plus" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}
