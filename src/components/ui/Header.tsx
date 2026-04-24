import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "./Icon";
import { haptic } from "./haptics";
import { cn } from "@/lib/cn";

export function Header({
  title,
  subtitle,
  back,
  right,
  className,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <View className={cn("flex-row items-center gap-3 px-4 py-3", className)}>
      {back ? (
        <Pressable
          onPress={() => {
            haptic.light();
            router.canGoBack() ? router.back() : router.replace("/home");
          }}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-dime-bg-2"
        >
          <Icon name="chevron.left" size={20} color="#1C1C1E" />
        </Pressable>
      ) : null}
      <View className="flex-1">
        {title ? <Text className="text-[17px] font-semibold text-dime-ink">{title}</Text> : null}
        {subtitle ? <Text className="text-[12px] text-dime-ink-3">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
