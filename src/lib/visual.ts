// DIME design tokens — bold, modern Indian dining app.
// Aesthetic: warm cream surface, deep ink charcoal, vivid saffron-orange,
// supporting forest green for confirmations. Typography: Fraunces (display),
// Inter (body), IBM Plex Mono (numerics).

import { Easing } from "react-native";

export const T = {
  // Surfaces
  bg: "#F6F2EC",
  card: "#FFFFFF",
  ink: "#0E0E0C",
  ink2: "#3F3D38",
  muted: "#8B8780",
  hairline: "#E8E2D7",
  hairline2: "#EFE9DD",

  // Accents
  saffron: "#FF5A1F",
  saffronDeep: "#E04A12",
  amber: "#F8B400",
  forest: "#0F8A4F",
  forestSoft: "#E6F4ED",
  ruby: "#D43A2F",
  rubySoft: "#FCEAE6",
  lilac: "#6F5BFF",

  // Layered tints
  cream: "#FAF6EE",
  creamDeep: "#F0E8D8",
  ink5: "rgba(14,14,12,0.05)",
  ink8: "rgba(14,14,12,0.08)",

  // Type families (web only — native falls back to system sans)
  fontDisp: '"Fraunces", "Tiempos", "Iowan Old Style", Georgia, serif',
  fontBody: '"Inter", -apple-system, system-ui, sans-serif',
  fontMono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

// Backwards-compat exports so older code still resolves
export const surface = {
  page: T.bg,
  card: T.card,
  chip: T.cream,
  divider: T.hairline2,
  hairline: T.hairline,
  hairlineStrong: T.ink8,
  ink: T.ink,
  ink2: T.ink2,
  ink3: T.muted,
  ink4: T.hairline,
  glassTint: "rgba(0,0,0,0.45)",
} as const;

export const brand = {
  orange500: T.saffron,
  orange400: T.saffronDeep,
  orange300: "#FF7A2F",
  green: T.forest,
  greenDark: T.forest,
  red: T.ruby,
} as const;

export type GradientPreset = "premium" | "ai" | "subtle" | "heroDark" | "noir";
export type GlowPreset = "premium" | "subtle" | "gallery" | "webCard" | "noir";

type Stops = readonly [string, string, ...string[]];

export const gradients: Record<GradientPreset, Stops> = {
  premium: [T.saffronDeep, T.saffron] as const,
  ai: ["#FFB088", T.saffron] as const,
  subtle: ["rgba(0,0,0,0.04)", "rgba(0,0,0,0)"] as const,
  heroDark: [T.ink, "#1F1B17"] as const,
  noir: ["#1F1B17", T.ink] as const,
};

export function pickGradient(preset: GradientPreset): Stops {
  return gradients[preset];
}

export const glow: Record<GlowPreset, {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}> = {
  premium: {
    shadowColor: T.saffron,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  gallery: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    shadowColor: T.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
};

export const motion = {
  snap: { duration: 180, easing: Easing.out(Easing.cubic) },
  reveal: { duration: 280, easing: Easing.out(Easing.exp) },
  press: { duration: 90, scale: 0.97 },
} as const;

export function hairline(): string {
  return T.hairline;
}
