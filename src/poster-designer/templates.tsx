import { Image, Text, View } from "react-native";
import type { PosterData, PosterStyle, PosterTemplate } from "./types";

// Universal aspect: 16:9 banner. Hosts can scale it down without breaking layout.
function frame(width: number) {
  return { width, height: Math.round(width * 9 / 16), borderRadius: 16, overflow: "hidden" as const };
}

// 1. SPOTLIGHT — image left, content right.
const Spotlight: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { flexDirection: "row", backgroundColor: style.paper }]}>
    {style.showImage && data.imageUrl ? (
      <Image source={{ uri: data.imageUrl }} style={{ width: "45%", height: "100%" }} />
    ) : (
      <View style={{ width: "45%", height: "100%", backgroundColor: style.accent }} />
    )}
    <View style={{ flex: 1, padding: width * 0.04, justifyContent: "center" }}>
      <Text numberOfLines={1} style={{ color: style.accent, fontSize: width * 0.025, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
        {data.subtitle ?? "Featured"}
      </Text>
      <Text numberOfLines={2} style={{ color: style.ink, fontSize: width * 0.045, fontWeight: style.fontWeight, marginTop: 4 }}>
        {data.title}
      </Text>
      {data.body ? (
        <Text numberOfLines={2} style={{ color: style.ink, opacity: 0.7, fontSize: width * 0.025, marginTop: 4 }}>
          {data.body}
        </Text>
      ) : null}
      {data.ctaText ? (
        <View style={{ alignSelf: "flex-start", marginTop: width * 0.025, backgroundColor: style.accent, paddingHorizontal: width * 0.025, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ color: "#fff", fontSize: width * 0.022, fontWeight: "700" }}>{data.ctaText}</Text>
        </View>
      ) : null}
    </View>
  </View>
);

// 2. BOLD BANNER — full-bleed image with translucent overlay.
const BoldBanner: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.accent }]}>
    {style.showImage && data.imageUrl ? (
      <Image source={{ uri: data.imageUrl }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    ) : null}
    <View style={{ position: "absolute", inset: 0, backgroundColor: style.ink, opacity: 0.45 }} />
    <View style={{ flex: 1, padding: width * 0.05, justifyContent: "flex-end" }}>
      {data.subtitle ? (
        <Text style={{ color: "#fff", fontSize: width * 0.022, fontWeight: "700", letterSpacing: 3, textTransform: "uppercase", opacity: 0.85 }}>{data.subtitle}</Text>
      ) : null}
      <Text numberOfLines={2} style={{ color: "#fff", fontSize: width * 0.058, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 }}>{data.title}</Text>
      {data.ctaText ? (
        <View style={{ alignSelf: "flex-start", marginTop: width * 0.02, backgroundColor: "#fff", paddingHorizontal: width * 0.03, paddingVertical: 6, borderRadius: 999 }}>
          <Text style={{ color: style.accent, fontSize: width * 0.024, fontWeight: "700" }}>{data.ctaText}</Text>
        </View>
      ) : null}
    </View>
  </View>
);

// 3. MINIMAL CARD — clean white with accent corner.
const MinimalCard: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, borderWidth: 1, borderColor: "rgba(60,60,67,0.12)" }]}>
    <View style={{ position: "absolute", top: 0, right: 0, width: width * 0.18, height: width * 0.18, backgroundColor: style.accent, borderBottomLeftRadius: 20 }} />
    <View style={{ flex: 1, padding: width * 0.05, justifyContent: "center" }}>
      <Text style={{ color: style.accent, fontSize: width * 0.022, letterSpacing: 4, textTransform: "uppercase", fontWeight: "700" }}>{data.subtitle ?? "New"}</Text>
      <Text numberOfLines={2} style={{ color: style.ink, fontSize: width * 0.05, fontWeight: style.fontWeight, marginTop: 8 }}>{data.title}</Text>
      {data.body ? <Text numberOfLines={2} style={{ color: style.ink, opacity: 0.7, fontSize: width * 0.025, marginTop: 6 }}>{data.body}</Text> : null}
    </View>
  </View>
);

// 4. SPLIT COLOR — diagonal accent block.
const SplitColor: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, flexDirection: "row" }]}>
    <View style={{ width: "55%", padding: width * 0.05, justifyContent: "center" }}>
      <Text style={{ color: style.accent, fontSize: width * 0.022, letterSpacing: 3, textTransform: "uppercase", fontWeight: "700" }}>{data.subtitle ?? "Limited time"}</Text>
      <Text numberOfLines={3} style={{ color: style.ink, fontSize: width * 0.045, fontWeight: "800", marginTop: 6, letterSpacing: -0.5 }}>{data.title}</Text>
      {data.ctaText ? (
        <View style={{ alignSelf: "flex-start", marginTop: 8, borderWidth: 2, borderColor: style.accent, paddingHorizontal: width * 0.025, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ color: style.accent, fontSize: width * 0.022, fontWeight: "700" }}>{data.ctaText}</Text>
        </View>
      ) : null}
    </View>
    <View style={{ width: "45%", backgroundColor: style.accent, justifyContent: "center", alignItems: "center" }}>
      {style.showImage && data.imageUrl ? (
        <Image source={{ uri: data.imageUrl }} style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ color: "#fff", fontSize: width * 0.08, fontWeight: "800" }}>%</Text>
      )}
    </View>
  </View>
);

// 5. NEON DARK — dark canvas with accent glow.
const NeonDark: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: "#0F0F12" }]}>
    {style.showImage && data.imageUrl ? (
      <Image source={{ uri: data.imageUrl }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }} />
    ) : null}
    <View style={{ flex: 1, padding: width * 0.05, justifyContent: "center" }}>
      <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: style.accent }}>
        <Text style={{ color: "#fff", fontSize: width * 0.02, letterSpacing: 3, textTransform: "uppercase", fontWeight: "800" }}>{data.subtitle ?? "Hot"}</Text>
      </View>
      <Text numberOfLines={2} style={{ color: "#fff", fontSize: width * 0.058, fontWeight: "800", marginTop: 8, letterSpacing: -0.5 }}>{data.title}</Text>
      {data.ctaText ? (
        <Text style={{ color: style.accent, fontSize: width * 0.024, fontWeight: "700", marginTop: 8 }}>{data.ctaText} →</Text>
      ) : null}
    </View>
  </View>
);

// 6. CIRCLE BURST — playful, marketing-style.
const CircleBurst: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, alignItems: "center", justifyContent: "center" }]}>
    <View style={{ position: "absolute", left: -width * 0.1, top: -width * 0.1, width: width * 0.5, height: width * 0.5, borderRadius: 9999, backgroundColor: style.accent, opacity: 0.18 }} />
    <View style={{ position: "absolute", right: -width * 0.05, bottom: -width * 0.05, width: width * 0.3, height: width * 0.3, borderRadius: 9999, backgroundColor: style.accent, opacity: 0.28 }} />
    <View style={{ alignItems: "center", padding: width * 0.04 }}>
      <Text style={{ color: style.accent, fontSize: width * 0.022, letterSpacing: 4, textTransform: "uppercase", fontWeight: "700" }}>{data.subtitle ?? "Special"}</Text>
      <Text numberOfLines={2} style={{ color: style.ink, fontSize: width * 0.058, fontWeight: "800", textAlign: "center", marginTop: 8 }}>{data.title}</Text>
      {data.ctaText ? (
        <View style={{ marginTop: 10, backgroundColor: style.accent, paddingHorizontal: width * 0.03, paddingVertical: 5, borderRadius: 999 }}>
          <Text style={{ color: "#fff", fontSize: width * 0.022, fontWeight: "700" }}>{data.ctaText}</Text>
        </View>
      ) : null}
    </View>
  </View>
);

// 7. EDITORIAL — news-paper feel.
const Editorial: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, padding: width * 0.05 }]}>
    <View style={{ height: 2, width: width * 0.08, backgroundColor: style.accent, marginBottom: 8 }} />
    <Text style={{ color: style.accent, fontSize: width * 0.022, letterSpacing: 4, textTransform: "uppercase", fontWeight: "700" }}>{data.subtitle ?? "Story"}</Text>
    <Text numberOfLines={2} style={{ color: style.ink, fontSize: width * 0.05, fontStyle: "italic", fontWeight: "500", marginTop: 4, letterSpacing: -0.5 }}>{data.title}</Text>
    {data.body ? <Text numberOfLines={2} style={{ color: style.ink, fontSize: width * 0.025, marginTop: 4, opacity: 0.7 }}>{data.body}</Text> : null}
    {data.ctaText ? <Text style={{ color: style.accent, fontSize: width * 0.022, fontWeight: "600", marginTop: 6 }}>{data.ctaText} →</Text> : null}
  </View>
);

// 8. TICKET — coupon-style with dashed left edge.
const Ticket: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.accent, flexDirection: "row" }]}>
    <View style={{ width: width * 0.04, borderRightWidth: 2, borderRightColor: "#fff", borderStyle: "dashed", marginVertical: width * 0.03 }} />
    <View style={{ flex: 1, padding: width * 0.04, justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: width * 0.022, letterSpacing: 4, textTransform: "uppercase", fontWeight: "800", opacity: 0.9 }}>{data.subtitle ?? "Coupon"}</Text>
      <Text numberOfLines={2} style={{ color: "#fff", fontSize: width * 0.052, fontWeight: "800", marginTop: 6 }}>{data.title}</Text>
      {data.body ? <Text style={{ color: "#fff", fontSize: width * 0.022, opacity: 0.85, marginTop: 4 }}>{data.body}</Text> : null}
    </View>
    <View style={{ width: width * 0.18, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.12)" }}>
      <Text style={{ color: "#fff", fontSize: width * 0.05, fontWeight: "800" }}>{data.ctaText ?? "GO"}</Text>
    </View>
  </View>
);

// 9. POLAROID — image-first card.
const Polaroid: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, padding: width * 0.025 }]}>
    {style.showImage && data.imageUrl ? (
      <Image source={{ uri: data.imageUrl }} style={{ flex: 1, borderRadius: 8 }} />
    ) : (
      <View style={{ flex: 1, backgroundColor: style.accent, borderRadius: 8 }} />
    )}
    <View style={{ marginTop: 6 }}>
      <Text numberOfLines={1} style={{ color: style.ink, fontSize: width * 0.028, fontWeight: "700" }}>{data.title}</Text>
      <Text numberOfLines={1} style={{ color: style.ink, opacity: 0.6, fontSize: width * 0.02 }}>{data.subtitle ?? ""}</Text>
    </View>
  </View>
);

// 10. STACK — three-stacked vertical text.
const Stack: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, padding: width * 0.05, justifyContent: "center" }]}>
    <Text style={{ color: style.accent, fontSize: width * 0.06, fontWeight: "800", letterSpacing: -0.5 }}>{data.subtitle ?? "Today"}</Text>
    <Text numberOfLines={1} style={{ color: style.ink, fontSize: width * 0.06, fontWeight: "800", letterSpacing: -0.5 }}>{data.title}</Text>
    {data.body ? <Text numberOfLines={1} style={{ color: style.ink, opacity: 0.6, fontSize: width * 0.04, fontWeight: "600", marginTop: 2 }}>{data.body}</Text> : null}
  </View>
);

// 11. RIBBON — accent ribbon across the middle.
const Ribbon: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper }]}>
    {style.showImage && data.imageUrl ? (
      <Image source={{ uri: data.imageUrl }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }} />
    ) : null}
    <View style={{ position: "absolute", top: "30%", left: 0, right: 0, height: "40%", backgroundColor: style.accent, justifyContent: "center", paddingHorizontal: width * 0.04 }}>
      <Text numberOfLines={2} style={{ color: "#fff", fontSize: width * 0.05, fontWeight: "800" }}>{data.title}</Text>
      {data.subtitle ? <Text style={{ color: "#fff", fontSize: width * 0.025, opacity: 0.9, marginTop: 2 }}>{data.subtitle}</Text> : null}
    </View>
  </View>
);

// 12. INDEX CARD — minimal index-card layout.
const IndexCard: PosterTemplate["Render"] = ({ data, style, width }) => (
  <View style={[frame(width), { backgroundColor: style.paper, padding: width * 0.05, flexDirection: "row", alignItems: "center" }]}>
    <View style={{ width: width * 0.12, height: width * 0.12, borderRadius: 999, backgroundColor: style.accent, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: width * 0.05, fontWeight: "800" }}>{(data.subtitle ?? "★").slice(0, 1).toUpperCase()}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: width * 0.03 }}>
      <Text numberOfLines={1} style={{ color: style.ink, fontSize: width * 0.04, fontWeight: "800" }}>{data.title}</Text>
      <Text numberOfLines={2} style={{ color: style.ink, opacity: 0.65, fontSize: width * 0.024, marginTop: 2 }}>{data.body ?? data.subtitle ?? ""}</Text>
    </View>
    {data.ctaText ? (
      <View style={{ paddingHorizontal: width * 0.025, paddingVertical: 5, borderRadius: 999, backgroundColor: style.accent }}>
        <Text style={{ color: "#fff", fontSize: width * 0.022, fontWeight: "700" }}>{data.ctaText}</Text>
      </View>
    ) : null}
  </View>
);

// ====== Registry ======
const baseSwatches = ["#FC8019", "#0EA5E9", "#22C55E", "#EF4444", "#7C3AED", "#0F172A", "#D4AF37"];
const dStyle = (overrides: Partial<PosterStyle> = {}): PosterStyle => ({
  accent: "#FC8019",
  ink: "#1C1C1E",
  paper: "#FFFFFF",
  fontHeading: "Inter",
  fontWeight: "700",
  showImage: true,
  ...overrides,
});

export const POSTER_TEMPLATES: PosterTemplate[] = [
  { id: "spotlight", name: "Spotlight", description: "Image left, content right.",
    swatches: baseSwatches, defaultStyle: dStyle(), Render: Spotlight },
  { id: "bold-banner", name: "Bold Banner", description: "Full-bleed photo with overlay.",
    swatches: baseSwatches, defaultStyle: dStyle({ ink: "#0F0F12" }), Render: BoldBanner },
  { id: "minimal-card", name: "Minimal Card", description: "Clean white with accent corner.",
    swatches: baseSwatches, defaultStyle: dStyle({ showImage: false }), Render: MinimalCard },
  { id: "split-color", name: "Split Color", description: "Two-column accent block.",
    swatches: baseSwatches, defaultStyle: dStyle(), Render: SplitColor },
  { id: "neon-dark", name: "Neon Dark", description: "Dark canvas with accent glow.",
    swatches: ["#FC8019", "#FF3D5A", "#22C55E", "#0EA5E9", "#7C3AED", "#FFD700"],
    defaultStyle: dStyle({ paper: "#0F0F12", ink: "#FFFFFF" }), Render: NeonDark },
  { id: "circle-burst", name: "Circle Burst", description: "Playful circular accents.",
    swatches: baseSwatches, defaultStyle: dStyle({ showImage: false }), Render: CircleBurst },
  { id: "editorial", name: "Editorial", description: "Magazine-style serif.",
    swatches: ["#1C1C1E", "#7B2D26", "#114B5F", "#3F4739", "#8B5E3C"],
    defaultStyle: dStyle({ paper: "#F4EDDD", ink: "#2D1810", showImage: false }), Render: Editorial },
  { id: "ticket", name: "Coupon", description: "Ticket-style for offers.",
    swatches: baseSwatches, defaultStyle: dStyle({ showImage: false }), Render: Ticket },
  { id: "polaroid", name: "Polaroid", description: "Photo-first card.",
    swatches: baseSwatches, defaultStyle: dStyle(), Render: Polaroid },
  { id: "stack", name: "Stack", description: "Big stacked typography.",
    swatches: baseSwatches, defaultStyle: dStyle({ showImage: false }), Render: Stack },
  { id: "ribbon", name: "Ribbon", description: "Accent ribbon across photo.",
    swatches: baseSwatches, defaultStyle: dStyle(), Render: Ribbon },
  { id: "index-card", name: "Index Card", description: "Compact rounded badge.",
    swatches: baseSwatches, defaultStyle: dStyle({ showImage: false }), Render: IndexCard },
];

export function posterTemplateById(id: string): PosterTemplate | undefined {
  return POSTER_TEMPLATES.find((t) => t.id === id);
}
