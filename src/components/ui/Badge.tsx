import { Text, View } from "react-native";
import { cn } from "@/lib/cn";

type Tone = "orange" | "green" | "red" | "gray" | "gold" | "blue" | "yellow" | "dark";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  orange: { bg: "bg-dime-primary-50", text: "text-dime-primary-700" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700" },
  red: { bg: "bg-red-50", text: "text-red-700" },
  gray: { bg: "bg-neutral-100", text: "text-neutral-600" },
  gold: { bg: "bg-amber-50", text: "text-amber-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700" },
  dark: { bg: "bg-dime-ink", text: "text-white" },
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
    <View className={cn("flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5", s.bg, className)}>
      {leading}
      <Text className={cn("text-[11px] font-bold uppercase", s.text)} style={{ letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  );
}

export function VegDot({ veg }: { veg: boolean }) {
  return (
    <View
      className={cn(
        "h-4 w-4 items-center justify-center rounded-[3px] border-[1.5px]",
        veg ? "border-dime-success" : "border-dime-danger"
      )}
    >
      <View className={cn("h-2 w-2 rounded-full", veg ? "bg-dime-success" : "bg-dime-danger")} />
    </View>
  );
}
