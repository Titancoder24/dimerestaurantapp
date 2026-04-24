import { Text, View } from "react-native";
import { cn } from "@/lib/cn";

type Tone = "orange" | "green" | "red" | "gray" | "gold" | "blue" | "yellow";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  orange: { bg: "bg-dime-orange-50", text: "text-dime-orange-700" },
  green: { bg: "bg-green-50", text: "text-green-700" },
  red: { bg: "bg-red-50", text: "text-red-700" },
  gray: { bg: "bg-gray-100", text: "text-gray-700" },
  gold: { bg: "bg-amber-50", text: "text-amber-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700" },
};

export function Badge({
  label,
  tone = "gray",
  leading,
  className,
}: {
  label: string;
  tone?: Tone;
  leading?: React.ReactNode;
  className?: string;
}) {
  const s = toneStyles[tone];
  return (
    <View className={cn("flex-row items-center gap-1 self-start rounded-full px-2 py-1", s.bg, className)}>
      {leading}
      <Text className={cn("text-[11px] font-semibold uppercase", s.text)} style={{ letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

export function VegDot({ veg }: { veg: boolean }) {
  return (
    <View
      className={cn(
        "h-3 w-3 items-center justify-center rounded-[2px] border",
        veg ? "border-dime-success" : "border-dime-danger"
      )}
    >
      <View className={cn("h-1.5 w-1.5 rounded-full", veg ? "bg-dime-success" : "bg-dime-danger")} />
    </View>
  );
}
