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
  transparent,
  large,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  className?: string;
  transparent?: boolean;
  large?: boolean;
}) {
  const router = useRouter();
  return (
    <View className={cn("px-5 pb-2 pt-3", transparent ? "" : "bg-white", className)}>
      <View className="flex-row items-center gap-3">
        {back ? (
          <Pressable
            onPress={() => {
              haptic.light();
              router.canGoBack() ? router.back() : router.replace("/home");
            }}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/5"
          >
            <Icon name="chevron.left" size={18} color={transparent ? "#fff" : "#0F0F0F"} />
          </Pressable>
        ) : null}
        {!large && title ? (
          <View className="flex-1">
            <Text
              className={cn("text-[17px] font-bold", transparent ? "text-white" : "text-dime-ink")}
              style={{ letterSpacing: -0.3 }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className={cn("text-[12px]", transparent ? "text-white/70" : "text-dime-ink-3")}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : (
          <View className="flex-1" />
        )}
        {right}
      </View>
      {large && title ? (
        <View className="mt-4">
          <Text className="text-[28px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[14px] text-dime-ink-3">{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
