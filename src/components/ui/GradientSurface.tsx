import { useColorScheme, type ViewProps } from "react-native";
import { LinearGradient, type LinearGradientPoint } from "expo-linear-gradient";
import { gradient, type GradientName } from "@/lib/visual";
import { cn } from "@/lib/cn";

type Props = Omit<ViewProps, "children"> & {
  preset: GradientName;
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
  className?: string;
  children?: React.ReactNode;
};

export function GradientSurface({
  preset,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  className,
  style,
  children,
  ...rest
}: Props) {
  const scheme = useColorScheme() === "light" ? "light" : "dark";
  const g = gradient(preset, scheme);
  return (
    <LinearGradient
      colors={g.colors as unknown as readonly [string, string, ...string[]]}
      start={start}
      end={end}
      className={cn(className)}
      style={style}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
}
