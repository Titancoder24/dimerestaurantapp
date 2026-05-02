import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";
import { haptic } from "./haptics";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "premium";
type Size = "sm" | "md" | "lg";
type Tone = "default" | "contrast";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  tone?: Tone;
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
  tone = "default",
  loading,
  disabled,
  leading,
  trailing,
  fullWidth,
  className,
  onPress,
  ...rest
}: Props) {
  // Light-mode app: contrast tone fills the button with a premium
  // near-black so it sits with confidence on white surfaces.
  const isContrast = tone === "contrast";

  const v = isContrast
    ? "bg-[#0E0D0C] active:opacity-90"
    : {
        primary: "bg-dime-primary-500 active:bg-dime-primary-600",
        secondary: "bg-white border border-dime-border-strong active:bg-dime-bg-2",
        ghost: "bg-transparent active:bg-dime-bg-2",
        destructive: "bg-dime-danger active:opacity-90",
        premium: "bg-dime-orange-500 active:bg-dime-orange-600",
      }[variant];

  const tv = isContrast
    ? "text-white"
    : {
        primary: "text-white",
        secondary: "text-dime-ink",
        ghost: "text-dime-ink",
        destructive: "text-white",
        premium: "text-white",
      }[variant];

  const spinnerColor = isContrast
    ? "#fff"
    : variant === "secondary" || variant === "ghost" ? "#FC8019" : "#fff";

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
        <ActivityIndicator color={spinnerColor} />
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
