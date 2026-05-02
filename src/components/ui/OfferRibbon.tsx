import { Text, View } from "react-native";
import { Icon } from "./Icon";

type Tone = "green" | "blue" | "orange";

type Props = {
  label: string;
  tone?: Tone;
  icon?: string;
};

const palette: Record<Tone, { bg: string; fg: string; border: string; iconColor: string }> = {
  green: { bg: "#E6F4EA", fg: "#1E7A3A", border: "#C6E4CF", iconColor: "#1E7A3A" },
  blue: { bg: "#E8F1FE", fg: "#1B4FA8", border: "#CDDFFB", iconColor: "#1B4FA8" },
  orange: { bg: "#FFF1E0", fg: "#9A3D00", border: "#FFD9AE", iconColor: "#FC8019" },
};

export function OfferRibbon({ label, tone = "green", icon }: Props) {
  const c = palette[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        alignSelf: "flex-start",
      }}
    >
      {icon ? <Icon name={icon} size={11} color={c.iconColor} /> : null}
      <Text style={{ fontSize: 11, fontWeight: "700", color: c.fg, letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}
