import { useMemo, useState } from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Chip, ChipRow, Header, Icon, Input, Screen } from "@/components/ui";
import { useRestaurants } from "@/hooks/queries";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";

const cuisines = ["All", "North Indian", "Italian", "Japanese", "Vegan", "Mughlai", "Continental", "Pizza"];

export default function Discover() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState<string>("All");
  const [priceMax, setPriceMax] = useState<number>(4);
  const [minRating, setMinRating] = useState<number>(0);
  const { data: restaurants, isLoading } = useRestaurants();

  const filtered = useMemo(() => {
    let list = restaurants ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
          (r.description ?? "").toLowerCase().includes(q)
      );
    }
    if (cuisine !== "All") {
      list = list.filter((r) => r.cuisines.includes(cuisine));
    }
    list = list.filter((r) => r.price_range <= priceMax && Number(r.rating) >= minRating);
    if (params.q === "fine_dine") list = list.filter((r) => r.type === "fine_dine");
    return list;
  }, [restaurants, search, cuisine, priceMax, minRating, params.q]);

  return (
    <Screen scroll={false}>
      <Header title="Discover" subtitle={`${filtered.length} restaurants`} />
      <View className="px-4">
        <Input
          placeholder="Search names, cuisines, dishes..."
          value={search}
          onChangeText={setSearch}
          leading={<Icon name="magnifyingglass" size={18} color="#8E8E93" />}
          returnKeyType="search"
        />
      </View>

      <View className="mt-3 px-4">
        <FlatList
          horizontal
          data={cuisines}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Chip label={item} selected={cuisine === item} onPress={() => setCuisine(item)} />
          )}
        />
      </View>

      <View className="mt-3 px-4">
        <ChipRow>
          {[1, 2, 3, 4].map((p) => (
            <Chip
              key={p}
              label={"₹".repeat(p) + " & below"}
              selected={priceMax === p}
              onPress={() => setPriceMax(p)}
            />
          ))}
          {[0, 4, 4.5].map((r) => (
            <Chip key={r} label={r === 0 ? "Any rating" : `${r}★+`} selected={minRating === r} onPress={() => setMinRating(r)} />
          ))}
        </ChipRow>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => <RestaurantCard restaurant={item} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center py-16">
              <Icon name="magnifyingglass" size={32} color="#C7C7CC" />
              <Text className="mt-3 text-[15px] font-semibold text-dime-ink">No results</Text>
              <Text className="mt-1 text-[13px] text-dime-ink-3">Try another cuisine or clear filters.</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}
