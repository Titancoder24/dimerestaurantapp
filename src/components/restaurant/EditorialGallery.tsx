import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { GlassButton } from "@/components/ui";
import { glow, surface } from "@/lib/visual";
import { haptic } from "@/components/ui/haptics";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";

type Props = {
  images: string[];
  onBack?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onOpenGallery?: () => void;
  bookmarked?: boolean;
  height?: number;
};

const PILL_SIZE = { paddingHorizontal: 14, paddingVertical: 8 } as const;

export function EditorialGallery({
  images,
  onBack,
  onBookmark,
  onShare,
  onOpenGallery,
  bookmarked,
  height,
}: Props) {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, 768);
  const galleryHeight = height ?? Math.min(containerWidth * 0.78, 360);
  const safe = images.filter(Boolean);

  const renderImage = (uri: string | undefined, h: number, w?: number) => (
    <View
      style={[
        {
          height: h,
          width: w ?? "100%",
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#1c1c1e",
        },
        glow.gallery,
      ]}
    >
      {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} /> : null}
    </View>
  );

  let layout: React.ReactNode;
  if (safe.length >= 3) {
    const gap = 8;
    const innerHeight = galleryHeight;
    const halfHeight = (innerHeight - gap) / 2;
    layout = (
      <View style={{ flexDirection: "row", gap }}>
        <View style={{ flex: 6, gap }}>
          {renderImage(safe[0], halfHeight)}
          {renderImage(safe[1], halfHeight)}
        </View>
        <View style={{ flex: 4 }}>
          {renderImage(safe[2], innerHeight)}
        </View>
      </View>
    );
  } else if (safe.length === 2) {
    layout = (
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>{renderImage(safe[0], galleryHeight)}</View>
        <View style={{ flex: 1 }}>{renderImage(safe[1], galleryHeight)}</View>
      </View>
    );
  } else {
    layout = renderImage(safe[0], galleryHeight);
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View style={{ position: "relative" }}>
        {layout}

        {/* Top overlay buttons */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          pointerEvents="box-none"
        >
          <GlassButton
            icon="chevron.left"
            onPress={() => {
              haptic.light();
              onBack?.();
            }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GlassButton
              icon={bookmarked ? "bookmark.fill" : "bookmark"}
              onPress={() => {
                haptic.select();
                onBookmark?.();
              }}
            />
            <GlassButton
              icon="square.and.arrow.up"
              onPress={() => {
                haptic.light();
                onShare?.();
              }}
            />
          </View>
        </View>

        {/* "View gallery" pill bottom-right of right column when collage */}
        {safe.length >= 1 ? (
          <Pressable
            onPress={() => {
              haptic.light();
              onOpenGallery?.();
            }}
            style={{
              position: "absolute",
              bottom: 14,
              alignSelf: "center",
              right: 16,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            {Platform.OS === "web" ? (
              <View
                style={{
                  ...PILL_SIZE,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: surface.glassRim,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  View gallery ({safe.length || 1})
                </Text>
              </View>
            ) : (
              <BlurView
                intensity={25}
                tint="dark"
                style={{
                  ...PILL_SIZE,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: surface.glassRim,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                  View gallery ({safe.length || 1})
                </Text>
              </BlurView>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
