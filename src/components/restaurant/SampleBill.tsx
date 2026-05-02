import { Pressable, Text, View, useColorScheme } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { GlowCard, GradientSurface, Icon } from "@/components/ui";
import { haptic } from "@/components/ui/haptics";
import { surface } from "@/lib/visual";
import { rupees } from "@/lib/format";

type Props = {
  estimatedBill: number;
  payable: number;
  saveUpTo: number;
  cashback: number;
  guests?: number;
  onCalculate?: () => void;
  pageBg?: string;
};

const ZIG = 8;
const ZIG_W = 16;

function ZigEdge({ direction, color }: { direction: "top" | "bottom"; color: string }) {
  // Repeating triangles. Width is filled via aspect ratio of viewBox.
  const points = direction === "top"
    ? `0,${ZIG} ${ZIG_W / 2},0 ${ZIG_W},${ZIG}`
    : `0,0 ${ZIG_W / 2},${ZIG} ${ZIG_W},0`;

  // We render multiple SVGs side-by-side via a flex row to repeat the shape.
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: ZIG,
        flexDirection: "row",
        ...(direction === "top" ? { top: 0 } : { bottom: 0 }),
      }}
    >
      {Array.from({ length: 32 }).map((_, i) => (
        <Svg key={i} width={ZIG_W} height={ZIG} viewBox={`0 0 ${ZIG_W} ${ZIG}`}>
          <Polygon points={points} fill={color} />
        </Svg>
      ))}
    </View>
  );
}

export function SampleBill({
  estimatedBill,
  payable,
  saveUpTo,
  cashback,
  guests = 2,
  onCalculate,
  pageBg,
}: Props) {
  const scheme = useColorScheme();
  const fallbackBg = scheme === "light" ? "#FFFFFF" : "#000000";
  const seamBg = pageBg ?? fallbackBg;
  const cardBg = scheme === "light" ? "#FFFFFF" : "#1C1C1E";

  return (
    <View>
      <GlowCard
        glow="subtle"
        style={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: cardBg,
          paddingTop: ZIG,
          paddingBottom: ZIG,
        }}
      >
        <ZigEdge direction="top" color={seamBg} />

        <View style={{ padding: 18, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: scheme === "light" ? "#3C3C43" : "rgba(255,255,255,0.7)" }}>
              Estimated bill for {guests} guests
            </Text>
            <Text className="text-dime-ink" style={{ fontSize: 14, fontWeight: "600" }}>
              {rupees(estimatedBill)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: scheme === "light" ? "#1C1C1E" : "#fff" }}>
              You pay
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: scheme === "light" ? "#1C1C1E" : "#fff" }}>
              {rupees(payable)}
            </Text>
          </View>

          <View
            style={{
              marginTop: 14,
              borderTopWidth: 1,
              borderTopColor: scheme === "light" ? surface.hairlineLight : surface.hairlineDark,
              borderStyle: "dashed",
              paddingTop: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon name="tag.fill" size={14} color="#FC8019" />
            <Text style={{ flex: 1, fontSize: 13, color: scheme === "light" ? "#1C1C1E" : "#fff" }}>
              Save up to{" "}
              <Text style={{ fontWeight: "700" }}>
                {rupees(saveUpTo)} + {rupees(cashback)} cashback
              </Text>
            </Text>
            <GradientSurface
              preset="premium"
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.4 }}>
                SAVE
              </Text>
            </GradientSurface>
          </View>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: scheme === "light" ? surface.hairlineLight : surface.hairlineDark,
          }}
        >
          <Pressable
            onPress={() => {
              haptic.light();
              onCalculate?.();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <Text className="text-dime-ink" style={{ fontSize: 13, fontWeight: "600" }}>
              Calculate savings on any bill amount
            </Text>
            <Icon name="chevron.right" size={14} color="#FC8019" />
          </Pressable>
        </View>

        <ZigEdge direction="bottom" color={seamBg} />
      </GlowCard>
    </View>
  );
}
