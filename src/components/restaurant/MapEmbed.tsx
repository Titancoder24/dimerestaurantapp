import { Image, Linking, Platform, Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import { T } from "@/lib/visual";

type Props = {
  lat: number | null | undefined;
  lng: number | null | undefined;
  height?: number;
  address?: string | null;
};

/**
 * Lightweight static-map embed.
 * On web: iframe over OpenStreetMap (no API key).
 * On native: rendered as a clickable card that opens the OS map app.
 */
export function MapEmbed({ lat, lng, height = 180, address }: Props) {
  const hasCoords = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const url = hasCoords
    ? `https://maps.google.com/?q=${lat},${lng}`
    : address
      ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
      : null;

  const openExternal = () => { if (url) Linking.openURL(url); };

  if (Platform.OS === "web" && hasCoords) {
    const lo = Number(lng) - 0.005;
    const hi = Number(lng) + 0.005;
    const lo2 = Number(lat) - 0.0025;
    const hi2 = Number(lat) + 0.0025;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lo}%2C${lo2}%2C${hi}%2C${hi2}&layer=mapnik&marker=${lat}%2C${lng}`;
    const Iframe = "iframe" as unknown as React.ComponentType<{
      src: string;
      style?: React.CSSProperties;
      loading?: string;
    }>;
    return (
      <View style={{ height, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: T.hairline, position: "relative" }}>
        <Iframe
          src={src}
          style={{ width: "100%", height, border: 0, display: "block" }}
          loading="lazy"
        />
        <Pressable
          onPress={openExternal}
          style={{
            position: "absolute", right: 12, bottom: 12,
            backgroundColor: T.ink, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Icon name="arrow.triangle.turn.up.right.diamond.fill" size={12} color={T.cream} />
          <Text style={{ color: T.cream, fontSize: 11, fontWeight: "700" }}>Directions</Text>
        </Pressable>
      </View>
    );
  }

  // Fallback card — pin + address + button
  return (
    <Pressable
      onPress={openExternal}
      style={{
        height,
        borderRadius: 16,
        backgroundColor: T.cream,
        borderWidth: 1, borderColor: T.hairline,
        padding: 18,
        alignItems: "flex-start", justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 36, height: 36, borderRadius: 999,
            backgroundColor: T.saffron,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="mappin" size={16} color="#fff" />
        </View>
        <Text
          style={{
            fontSize: 11, fontWeight: "700", color: T.muted,
            letterSpacing: 1.2, fontFamily: T.fontMono,
          }}
        >
          {hasCoords ? "EXACT LOCATION" : "ADDRESS"}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: "600", color: T.ink, lineHeight: 18 }} numberOfLines={3}>
        {address ?? (hasCoords ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : "Tap to view in Maps")}
      </Text>
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 5,
          backgroundColor: T.ink, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
        }}
      >
        <Icon name="arrow.triangle.turn.up.right.diamond.fill" size={12} color={T.cream} />
        <Text style={{ color: T.cream, fontSize: 11, fontWeight: "700" }}>Get directions</Text>
      </View>
    </Pressable>
  );
}
