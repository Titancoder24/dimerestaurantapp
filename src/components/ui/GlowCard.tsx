import { View, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { glow, type GlowPreset } from "@/lib/visual";

type Props = ViewProps & {
  glow?: GlowPreset;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function GlowCard({ glow: preset = "subtle", className, style, children, ...rest }: Props) {
  return (
    <View {...rest} className={className} style={[glow[preset], style]}>
      {children}
    </View>
  );
}
