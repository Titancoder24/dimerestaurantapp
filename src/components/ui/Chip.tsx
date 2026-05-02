import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/cn";
import { haptic } from "./haptics";

export function Chip({
  label,
  selected,
  onPress,
  leading,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      className={cn(
        "flex-row items-center gap-1.5 rounded-[8px] px-3 py-2",
        selected
          ? "bg-[#1C1C1E]"
          : "border border-[#E8E8E8] bg-white",
        disabled && "opacity-40"
      )}
    >
      {leading}
      <Text
        className={cn(
          "text-[12px] font-semibold",
          selected ? "text-white" : "text-[#535665]"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-2">{children}</View>;
}
