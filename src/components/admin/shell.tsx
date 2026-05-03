import { Pressable, Text, View, ScrollView } from "react-native";
import { Icon } from "@/components/ui/Icon";

// Solid dark Linear/Stripe-style palette — no translucent layers
export const ADMIN_BG = "#0A0A0A";
export const ADMIN_PANEL = "#0F0F0F";
export const ADMIN_PANEL2 = "#141414";
export const ADMIN_HOVER = "#181818";
export const ADMIN_ACTIVE = "#1F1F1F";
export const ADMIN_HAIRLINE = "#1F1F1F";
export const ADMIN_HAIRLINE2 = "#262626";
export const ADMIN_INK = "#FFFFFF";
export const ADMIN_INK2 = "#A3A3A3";
export const ADMIN_INK3 = "#737373";
export const ADMIN_ACCENT = "#FF5A1F";
export const ADMIN_ACCENT2 = "#6F5BFF";
export const ADMIN_GREEN = "#34D399";
export const ADMIN_RED = "#F87171";
export const ADMIN_AMBER = "#F8B400";
export const ADMIN_MONO = '"IBM Plex Mono", ui-monospace, monospace';
export const ADMIN_DISP = '"Fraunces", Georgia, serif';

export function PageHeader({
  eyebrow = "DIME ADMIN · SUPER · CONSOLE",
  title,
  subtitle,
  rightAction,
  onAction,
  actionIcon,
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightAction?: string;
  onAction?: () => void;
  actionIcon?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
        paddingBottom: 4, gap: 16, flexWrap: "wrap",
      }}
    >
      <View style={{ flex: 1, minWidth: 220 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: ADMIN_INK3, letterSpacing: 1.2, fontFamily: ADMIN_MONO }}>
          {eyebrow}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 26, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.7 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 4, fontSize: 13, color: ADMIN_INK2, letterSpacing: -0.05 }}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {rightSlot}
        {rightAction ? (
          <Pressable
            onPress={onAction}
            style={{
              height: 34, paddingHorizontal: 14, borderRadius: 8,
              backgroundColor: ADMIN_INK,
              flexDirection: "row", alignItems: "center", gap: 6,
            }}
          >
            {actionIcon ? <Icon name={actionIcon} size={12} color={ADMIN_BG} /> : null}
            <Text style={{ fontSize: 12.5, fontWeight: "700", color: ADMIN_BG, letterSpacing: -0.1 }}>
              {rightAction}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function CardShell({ children, padded = false }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: ADMIN_PANEL, borderRadius: 14,
        borderWidth: 1, borderColor: ADMIN_HAIRLINE, overflow: "hidden",
        padding: padded ? 18 : 0,
      }}
    >
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View
      style={{
        paddingHorizontal: 18, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: ADMIN_HAIRLINE,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.2 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, fontSize: 11.5, color: ADMIN_INK3, letterSpacing: 0.1 }}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function StatusDot({ color, size = 6 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function MonoText({ children, color = ADMIN_INK, size = 12, weight = "500" }: { children: React.ReactNode; color?: string; size?: number; weight?: "400" | "500" | "600" | "700" }) {
  return <Text style={{ fontFamily: ADMIN_MONO, fontSize: size, fontWeight: weight, color }}>{children}</Text>;
}

export function StatTile({
  icon,
  iconBg = "#1F1F1F",
  iconColor = ADMIN_INK,
  label,
  value,
  hint,
  delta,
}: {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive: boolean };
}) {
  return (
    <View
      style={{
        flex: 1, minWidth: 180,
        backgroundColor: ADMIN_PANEL, borderRadius: 14,
        borderWidth: 1, borderColor: ADMIN_HAIRLINE,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View
          style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: iconBg,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name={icon} size={14} color={iconColor} />
        </View>
        {delta ? (
          <View
            style={{
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
              backgroundColor: delta.positive ? "#0E2F1F" : "#3A1212",
              borderWidth: 1, borderColor: delta.positive ? "#1A5C3A" : "#5C1E1E",
            }}
          >
            <Text
              style={{
                fontSize: 10, fontWeight: "700",
                color: delta.positive ? ADMIN_GREEN : ADMIN_RED,
                fontFamily: ADMIN_MONO,
              }}
            >
              {delta.positive ? "↑" : "↓"} {delta.value}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={{ marginTop: 14, fontSize: 11, fontWeight: "600", color: ADMIN_INK3, letterSpacing: 0.4, textTransform: "uppercase", fontFamily: ADMIN_MONO }}>
        {label}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 24, fontWeight: "700", color: ADMIN_INK,
          letterSpacing: -0.6, fontFamily: ADMIN_MONO,
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text style={{ marginTop: 4, fontSize: 11.5, color: ADMIN_INK3 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "tray.fill",
  iconColor = ADMIN_ACCENT,
  iconBg = "#2B1810",
  title,
  body,
  actionLabel,
  onAction,
  text,
  compact,
}: {
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  text?: string;
  compact?: boolean;
}) {
  if (!title && text) {
    return (
      <View style={{ paddingVertical: compact ? 18 : 28, alignItems: "center" }}>
        <Text style={{ fontSize: 12, color: ADMIN_INK3 }}>{text}</Text>
      </View>
    );
  }
  return (
    <View
      style={{
        alignItems: "center", justifyContent: "center",
        paddingVertical: compact ? 24 : 40,
        paddingHorizontal: 24,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 46, height: 46, borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: ADMIN_HAIRLINE2,
        }}
      >
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ alignItems: "center", gap: 4, maxWidth: 360 }}>
        <Text style={{ fontSize: 14.5, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.2 }}>
          {title ?? "Nothing here yet"}
        </Text>
        {body ? (
          <Text style={{ fontSize: 12.5, color: ADMIN_INK3, textAlign: "center", lineHeight: 18 }}>
            {body}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          style={{
            marginTop: 4,
            height: 32, paddingHorizontal: 14, borderRadius: 7,
            backgroundColor: ADMIN_INK,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Icon name="plus" size={11} color={ADMIN_BG} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: ADMIN_BG, letterSpacing: -0.1 }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PageScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: ADMIN_BG }}
      contentContainerStyle={{ padding: 32, paddingBottom: 80, gap: 22, maxWidth: 1280 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{children}</View>;
}

export function Pill({
  children,
  tone = "neutral",
  icon,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "saffron" | "lilac" | "green" | "red" | "amber";
  icon?: string;
}) {
  const palette: Record<string, { bg: string; ink: string; border: string }> = {
    neutral: { bg: ADMIN_PANEL2, ink: ADMIN_INK2, border: ADMIN_HAIRLINE2 },
    saffron: { bg: "#2B1810", ink: ADMIN_ACCENT, border: "#5C2E18" },
    lilac:   { bg: "#1B1730", ink: ADMIN_ACCENT2, border: "#3E2F66" },
    green:   { bg: "#0E2F1F", ink: ADMIN_GREEN, border: "#1A5C3A" },
    red:     { bg: "#3A1212", ink: ADMIN_RED, border: "#5C1E1E" },
    amber:   { bg: "#2A2210", ink: ADMIN_AMBER, border: "#4A3E18" },
  };
  const p = palette[tone] ?? palette.neutral!;
  return (
    <View
      style={{
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
        backgroundColor: p.bg, borderWidth: 1, borderColor: p.border,
        flexDirection: "row", alignItems: "center", gap: 5,
      }}
    >
      {icon ? <Icon name={icon} size={10} color={p.ink} /> : null}
      <Text style={{ fontSize: 10.5, fontWeight: "700", color: p.ink, letterSpacing: 0.3, fontFamily: ADMIN_MONO, textTransform: "uppercase" }}>
        {children}
      </Text>
    </View>
  );
}

export function Row({ children, divider = true, last = false }: { children: React.ReactNode; divider?: boolean; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 18, paddingVertical: 12,
        borderBottomWidth: divider && !last ? 1 : 0,
        borderBottomColor: ADMIN_HAIRLINE,
      }}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11, fontWeight: "700", color: ADMIN_INK3,
        letterSpacing: 1.2, fontFamily: ADMIN_MONO, textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}
