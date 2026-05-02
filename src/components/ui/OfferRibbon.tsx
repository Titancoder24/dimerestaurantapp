import { Text, View } from "react-native";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

type Tone = "green" | "blue" | "orange";

const tones: Record<Tone, { bg: string; text: string; iconColor: string; icon: string }> = {
  green: { bg: "bg-green-50 dark:bg-emerald-500/10", text: "text-green-700 dark:text-emerald-300", iconColor: "#22C55E", icon: "tag.fill" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", iconColor: "#3B82F6", icon: "creditcard.fill" },
  orange: { bg: "bg-dime-orange-50 dark:bg-dime-orange-500/10", text: "text-dime-orange-700 dark:text-dime-orange-300", iconColor: "#FC8019", icon: "calendar" },
};

export function OfferRibbon({
  tone = "green",
  label,
  className,
}: {
  tone?: Tone;
  label: string;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <View className={cn("flex-row items-center gap-1.5 self-start rounded-md px-2 py-1", t.bg, className)}>
      <Icon name={t.icon} size={11} color={t.iconColor} />
      <Text className={cn("text-[11px] font-semibold", t.text)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
