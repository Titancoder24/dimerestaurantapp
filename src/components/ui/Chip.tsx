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
        "flex-row items-center gap-1.5 rounded-full border px-3.5 py-2",
        selected
          ? "bg-dime-orange-500 border-dime-orange-500"
          : "bg-white border-dime-border",
        disabled && "opacity-40"
      )}
    >
      {leading}
      <Text className={cn("text-[13px] font-medium", selected ? "text-white" : "text-dime-ink")}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-2">{children}</View>;
}
