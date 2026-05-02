import { Text, View } from "react-native";
import { GradientSurface } from "@/components/ui";
import { DiningTableIllustration } from "./illustrations/DiningTableIllustration";

type Props = {
  city?: string;
  count?: number;
};

export function HeroBanner({ city = "Bangalore", count = 0 }: Props) {
  return (
    <View style={{ borderRadius: 18, overflow: "hidden", marginTop: 16 }}>
      <GradientSurface
        preset="heroDark"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 28,
          paddingVertical: 26,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          minHeight: 200,
        }}
      >
        <View style={{ flex: 1, gap: 12 }}>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.18)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 1 }}>DINEOUT</Text>
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#fff",
              letterSpacing: -0.6,
              lineHeight: 34,
            }}
          >
            Dining out restaurants{"\n"}in {city}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
            {count > 0 ? `${count} curated venues with offers, cashback & priority booking.` : "Curated venues with offers, cashback & priority booking."}
          </Text>
        </View>
        <DiningTableIllustration width={220} height={160} />
      </GradientSurface>
    </View>
  );
}
