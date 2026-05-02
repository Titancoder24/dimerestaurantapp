import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { surface } from "@/lib/visual";
import { haptic } from "@/components/ui";

type Item = { label: string; href: string };

type Props = {
  title: string;
  items: Item[];
  showMore?: boolean;
  columns?: number;
};

export function LinkChipGrid({ title, items, showMore = true, columns = 4 }: Props) {
  const router = useRouter();
  const cellPercent = `${(100 / columns).toFixed(4)}%` as unknown as number;
  const all = showMore ? [...items, { label: "Show More", href: "#more" }] : items;

  return (
    <View style={{ marginTop: 32 }}>
      <Text style={{ fontSize: 17, fontWeight: "700", color: surface.ink, marginBottom: 14, letterSpacing: -0.2 }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {all.map((item, i) => {
          const isShowMore = item.href === "#more";
          return (
            <View key={`${item.label}-${i}`} style={{ width: cellPercent as unknown as number, padding: 4 }}>
              <Pressable
                onPress={() => {
                  haptic.light();
                  if (!isShowMore) {
                    router.push({ pathname: "/discover", params: { q: item.label } });
                  }
                }}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: surface.hairline,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isShowMore ? "700" : "500",
                    color: isShowMore ? "#FC8019" : surface.ink2,
                  }}
                >
                  {isShowMore ? "Show More ›" : item.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
