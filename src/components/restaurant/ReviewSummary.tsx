import { Text, View } from "react-native";
import { Icon } from "@/components/ui";
import { surface } from "@/lib/visual";

type Props = {
  overall: number;
  totalReviews: number;
  axes: { label: string; value: number }[];
};

export function ReviewSummary({ overall, totalReviews, axes }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 60,
            height: 64,
            borderRadius: 12,
            backgroundColor: "#1E7A3A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Icon name="star.fill" size={11} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{overall.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={{ marginTop: 6, fontSize: 11, color: surface.ink3 }}>{totalReviews} ratings</Text>
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        {axes.map((a, idx) => (
          <View key={a.label} style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: surface.ink }}>
                {a.value > 0 ? a.value.toFixed(1) : "—"}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 11, color: surface.ink3 }}>{a.label}</Text>
            </View>
            {idx < axes.length - 1 ? (
              <View style={{ width: 1, backgroundColor: surface.hairline }} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
