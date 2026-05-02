import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { Badge, Icon, VegDot } from "@/components/ui";
import { rupees } from "@/lib/format";
import { surface } from "@/lib/visual";
import type { Tables } from "@/lib/supabase";

type Group = {
  category: Tables<"menu_categories">;
  items: Tables<"menu_items">[];
};

type Props = {
  groups: Group[];
  onItemPress?: (item: Tables<"menu_items">) => void;
};

export function MenuList({ groups, onItemPress }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>(groups[0]?.category.id ?? "");
  const scheme = useColorScheme();
  const isDark = scheme !== "light";

  const visibleGroups = useMemo(() => {
    if (!activeCategory) return groups;
    const idx = groups.findIndex((g) => g.category.id === activeCategory);
    if (idx === -1) return groups;
    return groups.slice(idx).concat(groups.slice(0, idx));
  }, [activeCategory, groups]);

  if (groups.length === 0) {
    return (
      <View style={{ paddingVertical: 40, alignItems: "center" }}>
        <Text className="text-dime-ink-3" style={{ fontSize: 13 }}>
          Menu coming soon.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {groups.map((g) => {
          const isActive = g.category.id === activeCategory;
          return (
            <Pressable
              key={g.category.id}
              onPress={() => setActiveCategory(g.category.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isActive
                  ? "#FC8019"
                  : isDark
                  ? surface.hairlineDark
                  : surface.hairlineLight,
                backgroundColor: isActive
                  ? "rgba(252,128,25,0.12)"
                  : isDark
                  ? "#1C1C1E"
                  : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? "#FC8019" : isDark ? "#fff" : "#1C1C1E",
                }}
              >
                {g.category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 16, gap: 22 }}>
        {visibleGroups.map((g) => (
          <View key={g.category.id}>
            <Text className="text-dime-ink" style={{ fontSize: 17, fontWeight: "700" }}>
              {g.category.name}{" "}
              <Text className="text-dime-ink-3" style={{ fontSize: 12 }}>
                ({g.items.length})
              </Text>
            </Text>
            <View style={{ marginTop: 10, gap: 12 }}>
              {g.items.map((item) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  onPress={() => onItemPress?.(item)}
                  isDark={isDark}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function MenuRow({
  item,
  onPress,
  isDark,
}: {
  item: Tables<"menu_items">;
  onPress?: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
        backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <VegDot veg={item.is_veg} />
          {item.is_bestseller ? <Badge tone="gold" label="Bestseller" /> : null}
          {item.spice_level > 0 ? (
            <View style={{ flexDirection: "row" }}>
              {Array.from({ length: item.spice_level }).map((_, i) => (
                <Icon key={i} name="flame.fill" size={11} color="#EF4444" />
              ))}
            </View>
          ) : null}
        </View>
        <Text
          className="text-dime-ink"
          style={{ marginTop: 6, fontSize: 15, fontWeight: "600" }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="text-dime-ink-2" style={{ fontSize: 13, fontWeight: "600" }}>
          {rupees(item.price)}
        </Text>
        {item.description ? (
          <Text className="text-dime-ink-3" style={{ marginTop: 4, fontSize: 12 }} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <View>
        <Image
          source={{ uri: item.images[0] ?? "" }}
          style={{ width: 88, height: 88, borderRadius: 14, backgroundColor: "#222" }}
        />
      </View>
    </Pressable>
  );
}
