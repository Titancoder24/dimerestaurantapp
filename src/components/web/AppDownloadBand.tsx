import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { GradientSurface } from "@/components/ui";

export function AppDownloadBand() {
  return (
    <View style={{ marginTop: 32 }}>
      <GradientSurface
        preset="heroDark"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 18,
          paddingHorizontal: 32,
          paddingVertical: 28,
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
        }}
      >
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: 1.5 }}>
            ON THE GO
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 }}>
            Get the DIME App now!
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.85)" }}>
            For best offers and discounts curated specially for you.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 14,
          }}
        >
          <QRCode value="https://dimerestaurantapp.vercel.app" size={104} backgroundColor="#fff" color="#1C1C1E" />
        </View>
      </GradientSurface>
    </View>
  );
}
