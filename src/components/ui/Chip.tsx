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
        "flex-row items-center gap-2 rounded-full px-4 py-2.5",
        selected
          ? "bg-dime-ink"
          : "bg-dime-bg-2",
        disabled && "opacity-40"
      )}
    >
      {leading}
      <Text
        className={cn(
          "text-[13px] font-semibold",
          selected ? "text-white" : "text-dime-ink-2"
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
