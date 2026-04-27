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
    <View className={cn("flex-row items-center gap-4 bg-white px-5 py-4", className)}>
      {leading ? <View>{leading}</View> : null}
      <View className="flex-1">
        <Text
          className={cn("text-[15px] font-medium", destructive ? "text-dime-danger" : "text-dime-ink")}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] text-dime-ink-3">{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
      {chevron && onPress ? <Icon name="chevron.right" size={14} color="#BFBFBF" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
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
    <View className="mt-6">
      {title ? (
        <Text
          className="mb-3 px-5 text-[11px] font-bold uppercase text-dime-ink-3"
          style={{ letterSpacing: 1.2 }}
        >
          {title}
        </Text>
      ) : null}
      <View className="mx-5 overflow-hidden rounded-2xl bg-white"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 }}
      >
        {children}
      </View>
    </View>
  );
}
