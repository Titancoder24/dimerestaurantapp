import { Pressable, Text, View } from "react-native";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";
import { haptic } from "./haptics";

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron = true,
  destructive,
  className,
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  className?: string;
}) {
  const content = (
    <View className={cn("flex-row items-center gap-3 bg-white px-4 py-3", className)}>
      {leading ? <View>{leading}</View> : null}
      <View className="flex-1">
        <Text className={cn("text-[15px] font-medium", destructive ? "text-dime-danger" : "text-dime-ink")}>
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-[13px] text-dime-ink-3">{subtitle}</Text> : null}
      </View>
      {trailing}
      {chevron && onPress ? <Icon name="chevron.right" size={16} color="#C7C7CC" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
    >
      {content}
    </Pressable>
  );
}

export function ListSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4">
      {title ? (
        <Text className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-dime-ink-3">
          {title}
        </Text>
      ) : null}
      <View className="mx-4 overflow-hidden rounded-2xl border border-dime-border bg-white">{children}</View>
    </View>
  );
}
