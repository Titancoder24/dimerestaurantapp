// Centralised gradient, glow, motion and surface tokens.
// DIME is light-mode only — no dark surfaces. Brand orange stays
// vivid (#FC8019 → #FFB56B) for premium accents on white surfaces.

import { Easing } from "react-native";

export type GradientPreset = "premium" | "ai" | "subtle" | "heroDark" | "noir";
export type GlowPreset = "premium" | "subtle" | "gallery" | "webCard" | "noir";

type Stops = readonly [string, string, ...string[]];

// 3.1 — Gradient stops. Premium stays strong even on white surfaces
// because it's the brand accent.
export const gradients: Record<GradientPreset, Stops> = {
  premium: ["#FC8019", "#FFB56B"] as const,
  ai: ["#FFB56B", "#FE9C3F", "#FC8019"] as const,
  subtle: ["rgba(0,0,0,0.04)", "rgba(0,0,0,0)"] as const,
  // The web hero banner *is* dark — that's its job. Restricted to
  // that one surface only; everything else in the app is white.
  heroDark: ["#FF8E3C", "#FC8019", "#E36A0E"] as const,
  // Premium black surface for cashback ribbons / offer coupons.
  // Subtle warm-shifted near-black so it doesn't feel like a flat
  // CSS rectangle.
  noir: ["#1F1B17", "#0E0D0C"] as const,
};

export function pickGradient(preset: GradientPreset): Stops {
  return gradients[preset];
}

// 3.2 — Glow shadows
export const glow: Record<GlowPreset, {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}> = {
  premium: {
    shadowColor: "#FC8019",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  gallery: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  webCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 0,
  },
  noir: {
    shadowColor: "#0A0A0A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 6,
  },
};

// 3.3 — Motion
export const motion = {
  snap: { duration: 180, easing: Easing.out(Easing.cubic) },
  reveal: { duration: 280, easing: Easing.out(Easing.exp) },
  press: { duration: 90, scale: 0.97 },
} as const;

// 3.4 — Surface helpers (light-mode only)
export const surface = {
  page: "#FFFFFF",
  card: "#FFFFFF",
  chip: "#F8F8F8",
  divider: "#F2F2F2",
  hairline: "rgba(0,0,0,0.06)",
  hairlineStrong: "rgba(0,0,0,0.12)",
  ink: "#1C1C1E",
  ink2: "#535665",
  ink3: "#93959F",
  ink4: "#D4D4D8",
  glassTint: "rgba(0,0,0,0.45)",
} as const;

export function hairline(): string {
  return surface.hairline;
}

// Brand orange — single source of truth for SVG fills, native shadow
// colours, and any code that can't pull from Tailwind.
export const brand = {
  orange500: "#FC8019",
  orange400: "#FE9C3F",
  orange300: "#FFB56B",
  green: "#1E7A3A",
  greenDark: "#16A34A",
  red: "#E23744",
} as const;
