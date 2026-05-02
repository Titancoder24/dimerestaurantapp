import { Text, View, useColorScheme } from "react-native";
import { Icon } from "@/components/ui";
import { surface } from "@/lib/visual";

type Axis = { label: string; value: number };

type Props = {
  overall: number;
  totalReviews: number;
  axes: Axis[];
};

export function ReviewSummary({ overall, totalReviews, axes }: Props) {
  const scheme = useColorScheme();
  const divider = scheme === "light" ? surface.hairlineLight : surface.hairlineDark;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        gap: 16,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 60,
            height: 64,
            borderRadius: 12,
            backgroundColor: "#16A34A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Icon name="star.fill" size={11} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
              {overall.toFixed(1)}
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 9, fontWeight: "600", marginTop: 2 }}>
            {totalReviews}
          </Text>
        </View>
        <Text className="text-dime-ink-3" style={{ fontSize: 10, marginTop: 6 }}>
          {totalReviews} ratings
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {axes.map((a, i) => (
          <View
            key={a.label}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              ...(i > 0 ? { borderLeftWidth: 1, borderLeftColor: divider } : {}),
              paddingVertical: 6,
            }}
          >
            <Text className="text-dime-ink" style={{ fontSize: 18, fontWeight: "700" }}>
              {a.value > 0 ? a.value.toFixed(1) : "—"}
            </Text>
            <Text className="text-dime-ink-3" style={{ fontSize: 12, marginTop: 4 }}>
              {a.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
