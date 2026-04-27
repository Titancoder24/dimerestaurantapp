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

export function MobileBottomNav({
  items,
  primary,
}: {
  items: MobileNavItem[];
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
        className="flex-row items-center justify-around bg-white px-2 pt-2"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Pressable
              key={t.href}
              onPress={() => { haptic.light(); router.push(t.href as never); }}
              className="flex-1 items-center"
            >
              <View className={cn("h-8 w-14 items-center justify-center rounded-full", active && "bg-dime-primary-50")}>
                <Icon name={t.icon} size={18} color={active ? "#FF6B2C" : "#BFBFBF"} />
              </View>
              <Text
                className={cn("mt-0.5 text-[10px]", active ? "font-bold text-dime-primary-600" : "font-medium text-dime-ink-4")}
                style={{ letterSpacing: 0.2 }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => { haptic.light(); setMore(true); }}
          className="flex-1 items-center"
        >
          <View className={cn("h-8 w-14 items-center justify-center rounded-full", moreActive && "bg-dime-primary-50")}>
            <Icon name="ellipsis" size={18} color={moreActive ? "#FF6B2C" : "#BFBFBF"} />
          </View>
          <Text
            className={cn("mt-0.5 text-[10px]", moreActive ? "font-bold text-dime-primary-600" : "font-medium text-dime-ink-4")}
            style={{ letterSpacing: 0.2 }}
          >
            More
          </Text>
        </Pressable>
      </View>

      <Sheet visible={more} onClose={() => setMore(false)} maxHeight="80%">
        <Sheet.Body>
          <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
            All sections
          </Text>
          <ScrollView className="mt-4 max-h-[600px]" showsVerticalScrollIndicator={false}>
            {groupOrder.map((g) => (
              <View key={g} className="mb-4">
                <Text className="mb-2 text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
                  {g}
                </Text>
                <View className="overflow-hidden rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
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
                          "flex-row items-center gap-4 px-4 py-3.5",
                          idx > 0 && "border-t border-neutral-50"
                        )}
                      >
                        <View className={cn(
                          "h-9 w-9 items-center justify-center rounded-xl",
                          active ? "bg-dime-primary-50" : "bg-dime-bg-2"
                        )}>
                          <Icon name={n.icon} size={16} color={active ? "#FF6B2C" : "#8A8A8A"} />
                        </View>
                        <Text className={cn("flex-1 text-[15px]", active ? "font-bold text-dime-ink" : "font-medium text-dime-ink")}>
                          {n.label}
                        </Text>
                        <Icon name="chevron.right" size={14} color="#BFBFBF" />
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
