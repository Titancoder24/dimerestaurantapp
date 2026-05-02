// Centralised premium-look tokens for the Dineout flow.
// Anything that is not naturally expressible in Tailwind (gradient stops,
// shadow recipes, motion timings) lives here. Screens should import from
// this module instead of inlining hex values or shadow props.

import { Easing, type WithTimingConfig } from "react-native-reanimated";
import type { ColorValue, ViewStyle } from "react-native";

type GradientPreset = {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  locations?: readonly [number, number, ...number[]];
};

const dark = {
  premium: {
    colors: ["#FC8019", "#FFB56B"] as const,
  },
  ai: {
    colors: ["#FFB56B", "#FE9C3F", "#FC8019"] as const,
  },
  subtle: {
    colors: ["rgba(255,255,255,0.06)", "rgba(255,255,255,0)"] as const,
  },
} satisfies Record<string, GradientPreset>;

const light = {
  premium: {
    colors: ["#FFB56B", "#FFCF9E"] as const,
  },
  ai: {
    colors: ["#FFCF9E", "#FFB56B", "#FC8019"] as const,
  },
  subtle: {
    colors: ["rgba(0,0,0,0.04)", "rgba(0,0,0,0)"] as const,
  },
} satisfies Record<string, GradientPreset>;

export type GradientName = keyof typeof dark;

export function gradient(name: GradientName, scheme: "dark" | "light" = "dark"): GradientPreset {
  return scheme === "light" ? light[name] : dark[name];
}

// Drop-shadow halos. Spread these directly into a View `style` prop.
export const glow = {
  premium: {
    shadowColor: "#FC8019",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  gallery: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;

export type GlowName = keyof typeof glow;

// Motion presets used through react-native-reanimated's withTiming.
export const motion = {
  snap: { duration: 180, easing: Easing.out(Easing.cubic) },
  reveal: { duration: 280, easing: Easing.out(Easing.exp) },
  press: { duration: 90, easing: Easing.out(Easing.quad) },
} satisfies Record<string, WithTimingConfig>;

// Surface tints we read inline (rgba strings; can't be Tailwind-ed).
export const surface = {
  hairlineDark: "rgba(255,255,255,0.08)",
  hairlineLight: "rgba(60,60,67,0.12)",
  cardOnCardDark: "rgba(255,255,255,0.06)",
  glassTint: "rgba(0,0,0,0.5)",
  glassButtonTint: "rgba(0,0,0,0.45)",
  glassRim: "rgba(255,255,255,0.18)",
  scrimBottom: "rgba(0,0,0,0.55)",
  inkMutedDark: "rgba(255,255,255,0.45)",
};
