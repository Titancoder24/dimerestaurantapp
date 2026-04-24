import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Header, Icon, Screen, haptic } from "@/components/ui";
import { TEMPLATES } from "@/menu-designer/templates";

export default function MenuDesignerGallery() {
  const router = useRouter();

  return (
    <Screen>
      <Header title="Menu Designer" />

      <View className="mx-4 rounded-2xl bg-dime-orange-50 p-4">
        <View className="flex-row items-center gap-2">
          <Icon name="sparkles" size={16} color="#FC8019" />
          <Text className="text-[14px] font-semibold text-dime-orange-700">Pick a starting point</Text>
        </View>
        <Text className="mt-1 text-[12px] text-dime-orange-700">
          Choose a template, customize colors and fonts, then export a print-ready PDF. Your live menu items, prices and categories are pulled in automatically.
        </Text>
      </View>

      <View className="mx-4 mt-5 flex-row flex-wrap gap-3">
        {TEMPLATES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              haptic.light();
              router.push({ pathname: "/owner/menu-designer/[template]", params: { template: t.id } });
            }}
            className="w-[48%] overflow-hidden rounded-2xl border border-dime-border bg-white"
          >
            <Thumbnail templateId={t.id} accent={t.defaultStyle.accent} paper={t.defaultStyle.paper} ink={t.defaultStyle.ink} />
            <View className="p-3">
              <Text className="text-[13px] font-semibold text-dime-ink">{t.name}</Text>
              <Text numberOfLines={2} className="mt-0.5 text-[11px] text-dime-ink-3">{t.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View className="mx-4 mt-6 rounded-2xl border border-dashed border-dime-border bg-white p-4">
        <Text className="text-[13px] font-semibold text-dime-ink">Coming soon</Text>
        <Text className="mt-1 text-[12px] text-dime-ink-3">
          AI menu generator that auto-arranges your items, suggests dish descriptions and matches your brand. Until then the templates above will get you printed in a few minutes.
        </Text>
      </View>
    </Screen>
  );
}

/**
 * Native preview of each template — built with View/Text instead of HTML so
 * we don't need a webview. Approximates the printed PDF's vibe.
 */
function Thumbnail({ templateId, accent, paper, ink }: { templateId: string; accent: string; paper: string; ink: string }) {
  // Each preview has a distinct silhouette so the gallery isn't a wall of identical rectangles.
  switch (templateId) {
    case "sleek-modern":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3">
          <View style={{ backgroundColor: accent }} className="h-1 w-6 rounded-full" />
          <View className="mt-2"><Text style={{ color: ink, fontSize: 14, fontWeight: "700" }}>Aa</Text></View>
          <View style={{ backgroundColor: accent }} className="mt-3 h-0.5 w-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ backgroundColor: ink, opacity: 0.18 }} className="mt-2 h-1 w-full rounded-full" />
          ))}
        </View>
      );
    case "vintage-bistro":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-2">
          <View style={{ borderColor: accent }} className="flex-1 rounded-md border-2 p-3">
            <View className="items-center">
              <Text style={{ color: ink, fontSize: 12, fontStyle: "italic", fontWeight: "700" }}>Bistro</Text>
              <View style={{ backgroundColor: accent }} className="mt-1 h-px w-6" />
            </View>
            <View className="mt-2 flex-row gap-1">
              <View className="flex-1 gap-1">
                {[1,2,3].map((i) => <View key={i} style={{ backgroundColor: ink, opacity: 0.2 }} className="h-1 rounded-full" />)}
              </View>
              <View className="flex-1 gap-1">
                {[1,2,3].map((i) => <View key={i} style={{ backgroundColor: ink, opacity: 0.2 }} className="h-1 rounded-full" />)}
              </View>
            </View>
          </View>
        </View>
      );
    case "bold-statement":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4]">
          <View style={{ backgroundColor: accent }} className="h-1/2 p-3 justify-end">
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1 }}>BOLD</Text>
          </View>
          <View className="p-3 gap-1.5">
            <View style={{ backgroundColor: accent }} className="h-1 w-12" />
            {[1,2,3].map((i) => <View key={i} style={{ backgroundColor: ink, opacity: 0.18 }} className="h-1 w-full rounded-full" />)}
          </View>
        </View>
      );
    case "cafe-chalkboard":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3 justify-center items-center">
          <Text style={{ color: accent, fontSize: 22, fontFamily: "System", fontStyle: "italic" }}>Café</Text>
          <View style={{ backgroundColor: accent, opacity: 0.6 }} className="my-2 h-px w-12" />
          <View className="w-full gap-1.5">
            {[1,2,3].map((i) => (
              <View key={i} className="flex-row justify-between">
                <View style={{ backgroundColor: paper === "#1B2826" ? "#fff" : ink, opacity: 0.4 }} className="h-1 w-12 rounded-full" />
                <View style={{ backgroundColor: accent }} className="h-1 w-4 rounded-full" />
              </View>
            ))}
          </View>
        </View>
      );
    case "tropical-cafe":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3 items-center justify-center">
          <Text style={{ color: accent, fontSize: 18 }}>🌴</Text>
          <Text style={{ color: accent, fontSize: 14, fontWeight: "700" }}>Tropical</Text>
          <View style={{ backgroundColor: accent }} className="mt-1 self-center px-2 py-0.5 rounded-full">
            <Text style={{ color: "#fff", fontSize: 7, letterSpacing: 1 }}>MENU</Text>
          </View>
        </View>
      );
    case "fine-dine":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3 items-center">
          <Text style={{ color: accent, fontSize: 8, letterSpacing: 4 }}>CARTE</Text>
          <Text style={{ color: accent, fontSize: 18, fontStyle: "italic" }}>Élégance</Text>
          <View style={{ backgroundColor: accent, opacity: 0.5 }} className="mt-2 h-px w-full" />
          {[1,2,3].map((i) => (
            <View key={i} className="mt-2 items-center">
              <View style={{ backgroundColor: "#EFE7D2", opacity: 0.6 }} className="h-1 w-16 rounded-full" />
            </View>
          ))}
        </View>
      );
    case "street-food":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3 items-center justify-center">
          <View style={{ borderColor: ink, backgroundColor: "#fff" }} className="w-full rounded-2xl border-2 p-3 items-center">
            <Text style={{ color: accent, fontSize: 16, fontWeight: "900" }}>Hot!</Text>
          </View>
          <View style={{ backgroundColor: accent }} className="mt-2 h-2 w-2 rounded-full" />
        </View>
      );
    case "sushi-zen":
      return (
        <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3">
          <View style={{ backgroundColor: accent }} className="h-6 w-6 rounded-full" />
          <Text style={{ color: ink, fontSize: 12, fontWeight: "500", marginTop: 6 }}>禅 Zen</Text>
          <View className="mt-3 gap-1.5">
            {[1,2,3].map((i) => <View key={i} style={{ backgroundColor: ink, opacity: 0.15 }} className="h-1 rounded-full" />)}
          </View>
        </View>
      );
    default:
      return <View style={{ backgroundColor: paper }} className="aspect-[3/4]" />;
  }
}
