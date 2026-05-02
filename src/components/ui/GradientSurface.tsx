import { type ViewStyle, type StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { pickGradient, type GradientPreset } from "@/lib/visual";

type Props = {
  preset: GradientPreset;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function GradientSurface({
  preset,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  className,
  style,
  children,
}: Props) {
  const stops = pickGradient(preset);
  return (
    <LinearGradient
      colors={stops as unknown as readonly [string, string, ...string[]]}
      start={start}
      end={end}
      className={className}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
