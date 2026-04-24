import { Platform, useWindowDimensions, View } from "react-native";
import { usePathname } from "expo-router";

const NON_CUSTOMER_PREFIXES = ["/owner", "/admin", "/server"];

/**
 * Wraps the customer-facing screens. On web (desktop), it renders a
 * centered 440-px phone shell on a subtle orange-tinted gradient so
 * the customer app looks like the marketing screenshot rather than a
 * stretched website. On native it's a no-op pass-through.
 *
 * Owner / admin / server screens skip the frame because they're
 * full-window dashboards.
 */
export function MobileFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isDesktop = Platform.OS === "web" && width >= 900;
  const isCustomerRoute = !NON_CUSTOMER_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isDesktop || !isCustomerRoute) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        // Subtle orange-tinted background gradient using stacked layers.
        // (No external gradient lib needed — the radial illusion is good enough.)
        backgroundColor: "#FFF4EA",
      }}
    >
      {/* Decorative blob accents */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 360,
          height: 360,
          borderRadius: 9999,
          backgroundColor: "#FC8019",
          opacity: 0.18,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -160,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: 9999,
          backgroundColor: "#FFD166",
          opacity: 0.18,
        }}
      />

      <View
        style={{
          width: 440,
          height: Math.min(900, Math.max(720, Math.round(width * 0.85))),
          borderRadius: 36,
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
          // iOS-style multi-layer shadow on web
          boxShadow:
            "0 60px 120px rgba(15, 23, 42, 0.18), 0 12px 24px rgba(15, 23, 42, 0.08), inset 0 0 0 8px #1C1C1E",
        } as object}
      >
        {/* Notch */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: [{ translateX: -55 }],
            width: 110,
            height: 30,
            borderRadius: 999,
            backgroundColor: "#1C1C1E",
            zIndex: 50,
          }}
        />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}
