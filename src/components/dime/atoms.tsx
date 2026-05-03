// Dime design atoms — direct port of dime-app/project/tokens.jsx into RN.
// These are the shared pieces used across home / discover / restaurant /
// bookings screens. Keep them dumb and visual; no data.
import {
  Image,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type ImageStyle,
  type TextStyle,
  type PressableProps,
} from "react-native";
import { Icon } from "@/components/ui/Icon";
import { haptic } from "@/components/ui/haptics";
import { T } from "@/lib/visual";

/* ──────────────── Typography helpers ──────────────── */

export const display = (size: number, weight: TextStyle["fontWeight"] = "600", letter = -0.4): TextStyle => ({
  fontFamily: T.fontDisp,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: letter,
  color: T.ink,
});

export const mono = (size = 12, weight: TextStyle["fontWeight"] = "600", letter = 1.2): TextStyle => ({
  fontFamily: T.fontMono,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: letter,
  color: T.muted,
  textTransform: "uppercase",
});

export const num = (size = 13, weight: TextStyle["fontWeight"] = "500"): TextStyle => ({
  fontFamily: T.fontMono,
  fontSize: size,
  fontWeight: weight,
});

/* ──────────────── Img placeholder (diagonal stripes) ──────────────── */

type ImgKind = "restaurant" | "dish" | "brand" | "collection" | "order" | "user" | "auto";

type ImgProps = {
  uri?: string | null;
  label?: string;
  h?: number | "100%";
  w?: number | string;
  radius?: number;
  hue?: number;
  dark?: boolean;
  kind?: ImgKind;
  style?: StyleProp<ViewStyle> | StyleProp<ImageStyle>;
};

const KIND_ICON: Record<Exclude<ImgKind, "auto">, string> = {
  restaurant: "building.2.fill",
  dish: "fork.knife",
  brand: "sparkles",
  collection: "square.grid.2x2.fill",
  order: "bag.fill",
  user: "person.fill",
};

function inferKind(label: string | undefined): Exclude<ImgKind, "auto"> {
  if (!label) return "restaurant";
  const l = label.toLowerCase();
  if (l.includes("dish") || l.includes("menu")) return "dish";
  if (l.includes("brand") || l.includes("ad")) return "brand";
  if (l.includes("collection")) return "collection";
  if (l.includes("order") || l.includes("last order")) return "order";
  if (l.includes("user") || l.includes("avatar")) return "user";
  return "restaurant";
}

const oklchPalette: { hue: number; light: string; mid: string }[] = [
  { hue: 12, light: "#F2DCD4", mid: "#E6C2B6" },
  { hue: 18, light: "#F2D4C7", mid: "#E5BAA7" },
  { hue: 28, light: "#F2DCC0", mid: "#E5C49A" },
  { hue: 38, light: "#F1DDB5", mid: "#E2C58F" },
  { hue: 60, light: "#EBE3B7", mid: "#D9CD8C" },
  { hue: 130, light: "#D7E4C8", mid: "#B7CFA1" },
  { hue: 200, light: "#C7DBE3", mid: "#9DBCC7" },
  { hue: 280, light: "#DAD3E8", mid: "#B8AED4" },
  { hue: 320, light: "#E8D4DD", mid: "#CFADBC" },
];

function pickHueColors(hue?: number): { light: string; mid: string } {
  if (hue == null) return { light: "#F0E8D8", mid: "#E1D6BF" };
  let best = oklchPalette[0]!;
  let bestDist = Math.abs(best.hue - hue);
  for (const p of oklchPalette) {
    const d = Math.abs(p.hue - hue);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function Img({ uri, label, h = 160, w = "100%", radius = 14, hue, dark, kind = "auto", style }: ImgProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: w as number | `${number}%`,
            height: h as number,
            borderRadius: radius,
            backgroundColor: T.creamDeep,
          },
          style as StyleProp<ImageStyle>,
        ]}
        resizeMode="cover"
      />
    );
  }
  const c = pickHueColors(hue);
  const bg = dark ? T.ink : c.light;
  const iconName = KIND_ICON[kind === "auto" ? inferKind(label) : kind];
  const heightVal = h === "100%" ? 80 : (h as number);
  const iconSize = Math.max(20, Math.min(56, Math.round(heightVal * 0.36)));
  const iconColor = dark ? "rgba(255,255,255,0.6)" : "rgba(14,14,12,0.5)";
  return (
    <View
      style={[
        {
          width: w as number | `${number}%`,
          height: h as number,
          borderRadius: radius,
          backgroundColor: bg,
          overflow: "hidden",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
        },
        style as StyleProp<ViewStyle>,
      ]}
    >
      <Icon name={iconName} size={iconSize} color={iconColor} />
    </View>
  );
}

/* ──────────────── Pill ──────────────── */

type PillProps = {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  size?: number;
  weight?: TextStyle["fontWeight"];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
};

export function Pill({
  children,
  color = T.ink,
  bg = T.cream,
  size = 12,
  weight = "600",
  style,
  textStyle,
  icon,
}: PillProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[{ fontSize: size, fontWeight: weight, color, letterSpacing: 0.1 }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

/* ──────────────── Chip ──────────────── */

type ChipProps = PressableProps & {
  active?: boolean;
  children: React.ReactNode;
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ active, children, leading, onPress, style, ...rest }: ChipProps) {
  return (
    <Pressable
      onPress={(e) => {
        haptic.select();
        onPress?.(e);
      }}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: active ? T.ink : T.card,
          borderWidth: 1,
          borderColor: active ? T.ink : T.hairline,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        style,
      ]}
      {...rest}
    >
      {leading}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          letterSpacing: -0.1,
          color: active ? T.cream : T.ink,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

/* ──────────────── VegDot ──────────────── */

export function VegDot({ veg = true, size = 14 }: { veg?: boolean; size?: number }) {
  const c = veg ? T.forest : T.ruby;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderWidth: 1.5,
        borderColor: c,
        borderRadius: 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size, backgroundColor: c }} />
    </View>
  );
}

/* ──────────────── StarChip ──────────────── */

type StarChipProps = {
  score: string | number;
  size?: "sm" | "md";
};

export function StarChip({ score, size = "md" }: StarChipProps) {
  const sm = size === "sm";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: T.forest,
        paddingHorizontal: sm ? 6 : 8,
        paddingVertical: sm ? 2 : 3,
        borderRadius: 6,
      }}
    >
      <Icon name="star.fill" size={sm ? 9 : 10} color="#fff" />
      <Text
        style={{
          color: "#fff",
          fontSize: sm ? 11 : 12,
          fontWeight: "700",
          fontFamily: T.fontMono,
        }}
      >
        {typeof score === "number" ? score.toFixed(1) : score}
      </Text>
    </View>
  );
}

/* ──────────────── Section header (eyebrow + title + action) ──────────────── */

export function SectionHead({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 18, marginBottom: 12 }}>
      {eyebrow ? (
        <Text style={mono(10.5, "700", 1.4)}>{eyebrow}</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: eyebrow ? 4 : 0 }}>
        <Text style={display(22, "600", -0.4)}>{title}</Text>
        {action ? (
          <Pressable
            onPress={() => {
              haptic.light();
              onAction?.();
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: T.muted }}>{action}</Text>
            <Icon name="chevron.right" size={14} color={T.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ──────────────── Dime button ──────────────── */

type BtnVariant = "primary" | "dark" | "ghost" | "soft" | "danger";
type BtnSize = "sm" | "md" | "lg";

type DimeBtnProps = {
  label: string;
  variant?: BtnVariant;
  size?: BtnSize;
  onPress?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  full?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const btnPalette: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: T.saffron, fg: "#fff" },
  dark: { bg: T.ink, fg: T.cream },
  ghost: { bg: "transparent", fg: T.ink, border: T.ink },
  soft: { bg: T.cream, fg: T.ink },
  danger: { bg: T.ruby, fg: "#fff" },
};

export function DimeBtn({
  label,
  variant = "primary",
  size = "md",
  onPress,
  leading,
  trailing,
  full,
  disabled,
  style,
}: DimeBtnProps) {
  const tall = size === "lg" ? 54 : size === "sm" ? 38 : 48;
  const c = btnPalette[variant];
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={[
        {
          height: tall,
          borderRadius: 14,
          paddingHorizontal: 18,
          backgroundColor: c.bg,
          borderWidth: c.border ? 1 : 0,
          borderColor: c.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flex: full ? 1 : undefined,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {leading}
      <Text style={{ fontSize: 15, fontWeight: "700", letterSpacing: -0.1, color: c.fg }}>{label}</Text>
      {trailing}
    </Pressable>
  );
}

/* ──────────────── CTA strip (bottom-fixed action bar) ──────────────── */

export function CtaStrip({
  children,
  note,
  bottomInset = 28,
}: {
  children: React.ReactNode;
  note?: string;
  bottomInset?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: T.card,
        borderTopWidth: 1,
        borderTopColor: T.hairline,
        paddingTop: 12,
        paddingBottom: bottomInset,
        paddingHorizontal: 16,
      }}
    >
      {note ? (
        <View
          style={{
            backgroundColor: T.ink,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: T.amber, fontSize: 11 }}>●</Text>
          <Text
            style={{
              color: T.cream,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              flex: 1,
              fontFamily: T.fontMono,
            }}
          >
            {note}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10 }}>{children}</View>
    </View>
  );
}

/* ──────────────── Divider ──────────────── */

export function HR({ inset = 0, color = T.hairline }: { inset?: number; color?: string }) {
  return <View style={{ height: 1, backgroundColor: color, marginLeft: inset, marginRight: inset }} />;
}

/* ──────────────── Dot (separator) ──────────────── */

export function MiniDot() {
  return <Text style={{ fontSize: 10, color: T.hairline, marginHorizontal: 1 }}>•</Text>;
}
