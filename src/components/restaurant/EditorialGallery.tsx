import { Image, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { glow } from "@/lib/visual";
import { haptic } from "@/components/ui";

type Props = {
  images: string[];
  onPressImage?: (url: string, index: number) => void;
  onPressViewAll?: () => void;
};

export function EditorialGallery({ images, onPressImage, onPressViewAll }: Props) {
  const valid = images.filter(Boolean).slice(0, 3);

  if (valid.length === 0) {
    return <View style={{ height: 320, backgroundColor: "#F2F2F2" }} />;
  }

  if (valid.length === 1) {
    const url = valid[0]!;
    return (
      <Pressable onPress={() => { haptic.light(); onPressImage?.(url, 0); }}>
        <Image source={{ uri: url }} style={{ width: "100%", height: 320 }} resizeMode="cover" />
      </Pressable>
    );
  }

  if (valid.length === 2) {
    return (
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
        {valid.map((url, i) => (
          <Pressable key={i} style={{ flex: 1 }} onPress={() => { haptic.light(); onPressImage?.(url, i); }}>
            <Image
              source={{ uri: url }}
              style={[{ width: "100%", height: 260, borderRadius: 18 }, glow.gallery]}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
      {/* Left column 60% — two stacked */}
      <View style={{ flex: 6, gap: 8 }}>
        <Pressable onPress={() => { haptic.light(); onPressImage?.(valid[0]!, 0); }}>
          <Image
            source={{ uri: valid[0]! }}
            style={[{ width: "100%", aspectRatio: 1.4, borderRadius: 18 }, glow.gallery]}
            resizeMode="cover"
          />
        </Pressable>
        <Pressable onPress={() => { haptic.light(); onPressImage?.(valid[1]!, 1); }}>
          <Image
            source={{ uri: valid[1]! }}
            style={[{ width: "100%", aspectRatio: 1.4, borderRadius: 18 }, glow.gallery]}
            resizeMode="cover"
          />
        </Pressable>
      </View>

      {/* Right column 40% — one tall */}
      <View style={{ flex: 4 }}>
        <Pressable onPress={() => { haptic.light(); onPressImage?.(valid[2]!, 2); }} style={{ flex: 1 }}>
          <Image
            source={{ uri: valid[2]! }}
            style={[{ width: "100%", height: "100%", borderRadius: 18, minHeight: 280 }, glow.gallery]}
            resizeMode="cover"
          />
        </Pressable>
        <Pressable
          onPress={() => { haptic.light(); onPressViewAll?.(); }}
          style={{
            position: "absolute",
            bottom: 12,
            alignSelf: "center",
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View style={{ overflow: "hidden", borderRadius: 999 }}>
            <BlurView intensity={25} tint="dark">
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>View gallery</Text>
              </View>
            </BlurView>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
