import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";
import { haptic } from "./haptics";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "premium";
type Size = "sm" | "md" | "lg";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
};

const base = "flex-row items-center justify-center";
const sizes: Record<Size, string> = {
  sm: "h-10 px-4 rounded-xl",
  md: "h-[52px] px-6 rounded-2xl",
  lg: "h-[56px] px-7 rounded-2xl",
};
const textSizes: Record<Size, string> = {
  sm: "text-[13px] font-semibold tracking-wide",
  md: "text-[15px] font-semibold",
  lg: "text-[16px] font-bold",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  leading,
  trailing,
  fullWidth,
  className,
  onPress,
  ...rest
}: Props) {
  const v = {
    primary: "bg-dime-primary-500 active:bg-dime-primary-600",
    secondary: "bg-dime-bg-2 border border-dime-border active:bg-dime-bg-grouped",
    ghost: "bg-transparent active:bg-dime-bg-2",
    destructive: "bg-dime-danger active:opacity-90",
    premium: "bg-dime-ink active:opacity-90",
  }[variant];
  const tv = {
    primary: "text-white",
    secondary: "text-dime-ink",
    ghost: "text-dime-primary-600",
    destructive: "text-white",
    premium: "text-white",
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      onPress={(e) => {
        haptic.light();
        onPress?.(e);
      }}
      className={cn(base, sizes[size], v, isDisabled && "opacity-40", fullWidth && "w-full", className)}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? "#FF6B2C" : "#fff"} />
      ) : (
        <View className="flex-row items-center justify-center gap-2.5">
          {leading}
          <Text className={cn(textSizes[size], tv)}>{label}</Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}
