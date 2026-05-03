import { Pressable, Text, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";

export const OWNER_BG = "#FAFAFA";
export const OWNER_CARD = "#FFFFFF";
export const OWNER_HAIRLINE = "#ECECEC";
export const OWNER_INK = "#0E0E0C";
export const OWNER_INK2 = "#3F3D38";
export const OWNER_MUTED = "#8B8780";
export const OWNER_ACCENT = "#6F5BFF";
export const OWNER_MONO = '"IBM Plex Mono", ui-monospace, monospace';
export const OWNER_DISP = '"Fraunces", Georgia, serif';

export function PageHeader({
  title,
  subtitle,
  rightAction,
  onAction,
  actionIcon,
}: {
  title: string;
  subtitle?: string;
  rightAction?: string;
  onAction?: () => void;
  actionIcon?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
        paddingBottom: 4,
      }}
    >
      <View>
        <Text style={{ fontSize: 11, fontWeight: "600", color: OWNER_MUTED, letterSpacing: 0.2, fontFamily: OWNER_MONO }}>
          OWNER · MANAGER · SERVER
        </Text>
        <Text style={{ marginTop: 4, fontSize: 24, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.6 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, fontSize: 12, color: OWNER_MUTED, letterSpacing: -0.05 }}>{subtitle}</Text>
        ) : null}
      </View>
      {rightAction ? (
        <Pressable
          onPress={onAction}
          style={{
            height: 32, paddingHorizontal: 12, borderRadius: 7,
            backgroundColor: OWNER_INK,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          {actionIcon ? <Icon name={actionIcon} size={12} color="#fff" /> : null}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff", letterSpacing: -0.1 }}>
            {rightAction}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: OWNER_CARD, borderRadius: 12,
        borderWidth: 1, borderColor: OWNER_HAIRLINE, overflow: "hidden",
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
        paddingHorizontal: 18, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: OWNER_HAIRLINE,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK, letterSpacing: -0.2 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, fontSize: 11, color: OWNER_MUTED, letterSpacing: 0.1 }}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />;
}

export function MonoText({ children, color = OWNER_INK, size = 12, weight = "500" }: { children: React.ReactNode; color?: string; size?: number; weight?: "400" | "500" | "600" | "700" }) {
  return <Text style={{ fontFamily: OWNER_MONO, fontSize: size, fontWeight: weight, color }}>{children}</Text>;
}

/**
 * StatTile — zero-state friendly KPI tile for the top of every module.
 * Always renders even with `value="—"` so pages never feel empty.
 */
export function StatTile({
  icon,
  iconBg = "#F5F5F4",
  iconColor = OWNER_INK,
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
        backgroundColor: OWNER_CARD, borderRadius: 12,
        borderWidth: 1, borderColor: OWNER_HAIRLINE,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View
          style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: iconBg,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name={icon} size={13} color={iconColor} />
        </View>
        {delta ? (
          <View
            style={{
              paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
              backgroundColor: delta.positive ? "#E6F4ED" : "#FCEAE6",
            }}
          >
            <Text
              style={{
                fontSize: 10, fontWeight: "700",
                color: delta.positive ? "#0F8A4F" : "#D43A2F",
                fontFamily: OWNER_MONO,
              }}
            >
              {delta.positive ? "↑" : "↓"} {delta.value}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={{ marginTop: 12, fontSize: 11, fontWeight: "500", color: OWNER_MUTED, letterSpacing: 0.2 }}>
        {label}
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 22, fontWeight: "700", color: OWNER_INK,
          letterSpacing: -0.6, fontFamily: OWNER_MONO,
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text style={{ marginTop: 4, fontSize: 11, color: OWNER_MUTED }}>{hint}</Text>
      ) : null}
    </View>
  );
}

/**
 * EmptyState — production-grade zero-state card with icon, title, body, CTA.
 * Drop-in replacement for the old text-only "No items".
 */
export function EmptyState({
  icon = "tray.fill",
  iconColor = OWNER_ACCENT,
  iconBg = "#EEEAF6",
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
  // Backward compatibility: if old text-only call, still render compact text
  if (!title && text) {
    return (
      <View style={{ paddingVertical: compact ? 18 : 28, alignItems: "center" }}>
        <Text style={{ fontSize: 12, color: OWNER_MUTED }}>{text}</Text>
      </View>
    );
  }
  return (
    <View
      style={{
        alignItems: "center", justifyContent: "center",
        paddingVertical: compact ? 22 : 36,
        paddingHorizontal: 24,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ alignItems: "center", gap: 4, maxWidth: 320 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.2 }}>
          {title ?? "Nothing here yet"}
        </Text>
        {body ? (
          <Text style={{ fontSize: 12, color: OWNER_MUTED, textAlign: "center", lineHeight: 17 }}>
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
            backgroundColor: OWNER_INK,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Icon name="plus" size={11} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff", letterSpacing: -0.1 }}>
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
      style={{ flex: 1, backgroundColor: OWNER_BG }}
      contentContainerStyle={{ padding: 32, paddingBottom: 80, gap: 20, maxWidth: 1100 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

/**
 * StatRow — horizontal flex row of StatTiles. Use at top of every module.
 */
export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{children}</View>;
}
