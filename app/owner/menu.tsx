import { useState } from "react";
import { Alert, FlatList, Image, Pressable, Switch, Text, View } from "react-native";
import { Badge, Button, Chip, Header, Icon, Screen, VegDot } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useMenu } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { rupees } from "@/lib/format";
import { useToast } from "@/store/toast";

export default function OwnerMenu() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: menu } = useMenu(restaurant?.id);
  const qc = useQueryClient();
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  async function toggleAvailable(id: string, current: boolean) {
    await supabase.from("menu_items").update({ is_available: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["menu"] });
    toast.success(current ? "Item hidden" : "Item available");
  }

  async function deleteItem(id: string) {
    Alert.alert("Delete item?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await supabase.from("menu_items").delete().eq("id", id);
        qc.invalidateQueries({ queryKey: ["menu"] });
      } },
    ]);
  }

  const shown = activeCategory
    ? (menu?.items ?? []).filter((i) => i.category_id === activeCategory)
    : (menu?.items ?? []);

  return (
    <Screen scroll={false}>
      <Header title="Menu" subtitle={`${menu?.items.length ?? 0} items`} />
      <View className="px-4">
        <FlatList
          horizontal
          data={[null, ...(menu?.categories ?? [])]}
          keyExtractor={(c) => c?.id ?? "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Chip label={item?.name ?? "All"} selected={activeCategory === (item?.id ?? null)} onPress={() => setActiveCategory(item?.id ?? null)} />
          )}
        />
      </View>
      <FlatList
        data={shown}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View className="flex-row gap-3 rounded-2xl border border-dime-border bg-white p-3">
            <Image source={{ uri: item.images[0] ?? "" }} className="h-16 w-16 rounded-lg" />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <VegDot veg={item.is_veg} />
                <Text className="flex-1 text-[14px] font-semibold text-dime-ink">{item.name}</Text>
                {item.is_bestseller ? <Badge tone="gold" label="Best" /> : null}
              </View>
              <Text className="text-[12px] text-dime-ink-2">{rupees(item.price)}</Text>
              <View className="mt-1 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleAvailable(item.id, item.is_available)}
                    trackColor={{ true: "#FC8019", false: "#D1D1D6" }}
                  />
                  <Text className="text-[11px] text-dime-ink-3">{item.is_available ? "Available" : "Hidden"}</Text>
                </View>
                <Pressable onPress={() => deleteItem(item.id)} hitSlop={6}>
                  <Icon name="trash" size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <View className="absolute bottom-6 right-4">
        <Button
          label="Add item"
          leading={<Icon name="plus" size={14} color="#fff" />}
          onPress={() => toast.info("Coming soon", "Full item editor")}
        />
      </View>
    </Screen>
  );
}
