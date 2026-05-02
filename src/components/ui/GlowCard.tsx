import { View, type ViewProps } from "react-native";
import { glow, type GlowName } from "@/lib/visual";
import { cn } from "@/lib/cn";

type Props = ViewProps & {
  glow?: GlowName;
  className?: string;
};

export function GlowCard({ glow: tone = "subtle", className, style, children, ...rest }: Props) {
  return (
    <View className={cn(className)} style={[glow[tone], style]} {...rest}>
      {children}
    </View>
  );
}
