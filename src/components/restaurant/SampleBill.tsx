import { Pressable, Text, View } from "react-native";
import { Icon, haptic } from "@/components/ui";
import { surface } from "@/lib/visual";

type Props = {
  estimatedBill: number;
  youPay: number;
  saveUpTo: number;
  cashback: number;
  onCalculatePress?: () => void;
};

export function SampleBill({ estimatedBill, youPay, saveUpTo, cashback, onCalculatePress }: Props) {
  const totalSaving = saveUpTo + cashback;
  const savingPct = estimatedBill > 0 ? Math.round((totalSaving / estimatedBill) * 100) : 0;

  return (
    <View
      style={{
        borderRadius: 22,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: surface.hairline,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: surface.ink2 }}>For 2 guests</Text>
          {savingPct > 0 ? (
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#1E5E2F", letterSpacing: 0.4 }}>
              SAVE {savingPct}%
            </Text>
          ) : null}
        </View>

        {/* Big numbers row */}
        <View style={{ marginTop: 18, flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: surface.ink3, letterSpacing: 1.2 }}>
              YOU PAY
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 32,
                fontWeight: "800",
                color: surface.ink,
                letterSpacing: -1.2,
                lineHeight: 34,
              }}
            >
              ₹{youPay.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, fontWeight: "500", color: surface.ink3 }}>Bill before savings</Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: "600",
                color: surface.ink3,
                textDecorationLine: "line-through",
                textDecorationColor: surface.ink3,
              }}
            >
              ₹{estimatedBill.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Saving breakdown */}
        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: "#FFF8F1",
            borderWidth: 1,
            borderColor: "#FFE0BF",
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: "rgba(252,128,25,0.18)",
              borderWidth: 1,
              borderColor: "rgba(252,128,25,0.5)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="bolt.fill" size={11} color="#9A3D00" />
          </View>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: "#9A3D00", letterSpacing: -0.1 }}>
            ₹{saveUpTo.toLocaleString("en-IN")} instant
            <Text style={{ fontWeight: "500", color: "#B86A2A" }}> + </Text>
            ₹{cashback.toLocaleString("en-IN")} cashback
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => { haptic.light(); onCalculatePress?.(); }}
        style={{
          marginTop: 18,
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderTopColor: surface.hairline,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: surface.ink, letterSpacing: -0.1 }}>
          Calculate savings on any bill
        </Text>
        <Icon name="chevron.right" size={12} color={surface.ink3} />
      </Pressable>
    </View>
  );
}
