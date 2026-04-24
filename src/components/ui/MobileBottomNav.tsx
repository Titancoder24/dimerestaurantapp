import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, useRouter } from "expo-router";
import { Sheet } from "./Sheet";
import { Icon } from "./Icon";
import { haptic } from "./haptics";
import { cn } from "@/lib/cn";

export type MobileNavItem = {
  href: string;
  label: string;
  icon: string;
  group: string;
};

/**
 * iOS/Android-standard bottom nav for the dashboards (owner + admin).
 * Shows up to 4 primary tabs followed by a "More" tab that pops a sheet
 * grouping every other item by their `group` field.
 */
export function MobileBottomNav({
  items,
  primary,
}: {
  items: MobileNavItem[];
  /** Hrefs of the items to surface as quick tabs (first 4 in order). */
  primary: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [more, setMore] = useState(false);

  const tabs = primary
    .map((p) => items.find((i) => i.href === p))
    .filter((x): x is MobileNavItem => Boolean(x))
    .slice(0, 4);
  const restGrouped: Record<string, MobileNavItem[]> = {};
  for (const i of items) {
    if (tabs.includes(i)) continue;
    restGrouped[i.group] = restGrouped[i.group] ?? [];
    restGrouped[i.group]!.push(i);
  }
  const groupOrder = Object.keys(restGrouped);

  const moreActive = !tabs.some((t) => pathname.startsWith(t.href));

  return (
    <>
      <View
        className="flex-row items-center justify-around border-t border-dime-border bg-white/95 px-2 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Pressable
              key={t.href}
              onPress={() => { haptic.light(); router.push(t.href as never); }}
              className="flex-1 items-center"
            >
              <View className={cn("h-7 w-12 items-center justify-center rounded-full", active && "bg-dime-orange-50")}>
                <Icon name={t.icon} size={18} color={active ? "#FC8019" : "#8E8E93"} />
              </View>
              <Text className={cn("mt-0.5 text-[10px]", active ? "font-semibold text-dime-orange-600" : "text-dime-ink-3")}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => { haptic.light(); setMore(true); }}
          className="flex-1 items-center"
        >
          <View className={cn("h-7 w-12 items-center justify-center rounded-full", moreActive && "bg-dime-orange-50")}>
            <Icon name="ellipsis" size={18} color={moreActive ? "#FC8019" : "#8E8E93"} />
          </View>
          <Text className={cn("mt-0.5 text-[10px]", moreActive ? "font-semibold text-dime-orange-600" : "text-dime-ink-3")}>
            More
          </Text>
        </Pressable>
      </View>

      <Sheet visible={more} onClose={() => setMore(false)} maxHeight="80%">
        <Sheet.Body>
          <Text className="text-[18px] font-semibold text-dime-ink">All sections</Text>
          <ScrollView className="mt-3 max-h-[600px]" showsVerticalScrollIndicator={false}>
            {groupOrder.map((g) => (
              <View key={g} className="mb-3">
                <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-dime-ink-3">{g}</Text>
                <View className="overflow-hidden rounded-2xl border border-dime-border bg-white">
                  {restGrouped[g]!.map((n, idx) => {
                    const active = pathname.startsWith(n.href);
                    return (
                      <Pressable
                        key={n.href}
                        onPress={() => {
                          haptic.light();
                          setMore(false);
                          router.push(n.href as never);
                        }}
                        className={cn(
                          "flex-row items-center gap-3 p-3",
                          idx > 0 && "border-t border-dime-border"
                        )}
                      >
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-dime-bg-2">
                          <Icon name={n.icon} size={14} color={active ? "#FC8019" : "#8E8E93"} />
                        </View>
                        <Text className={cn("flex-1 text-[14px]", active ? "font-semibold text-dime-orange-700" : "text-dime-ink")}>
                          {n.label}
                        </Text>
                        <Icon name="chevron.right" size={14} color="#C7C7CC" />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </Sheet.Body>
      </Sheet>
    </>
  );
}
