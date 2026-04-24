import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";
import { haptic } from "./haptics";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
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

const base = "flex-row items-center justify-center rounded-xl";
const sizes: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-12 px-5",
  lg: "h-14 px-6",
};
const text: Record<Size, string> = {
  sm: "text-[14px] font-semibold",
  md: "text-[15px] font-semibold",
  lg: "text-[17px] font-semibold",
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
    primary: "bg-dime-orange-500 active:bg-dime-orange-600",
    secondary: "bg-transparent border border-dime-orange-500 active:bg-dime-orange-50",
    ghost: "bg-transparent",
    destructive: "bg-dime-danger",
  }[variant];
  const tv = {
    primary: "text-white",
    secondary: "text-dime-orange-600",
    ghost: "text-dime-orange-600",
    destructive: "text-white",
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
      className={cn(base, sizes[size], v, isDisabled && "opacity-50", fullWidth && "w-full", className)}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "destructive" ? "#fff" : "#FC8019"} />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leading}
          <Text className={cn(text[size], tv)}>{label}</Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}
