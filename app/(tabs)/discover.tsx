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
      <View className="px-5 pb-2 pt-3">
        <Text className="text-[28px] font-bold text-dime-ink" style={{ letterSpacing: -0.8 }}>
          Discover
        </Text>
        <Text className="mt-0.5 text-[14px] text-dime-ink-3">
          {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} near you
        </Text>
      </View>

      <View className="px-5">
        <Input
          placeholder="Search names, cuisines, dishes..."
          value={search}
          onChangeText={setSearch}
          leading={<Icon name="magnifyingglass" size={18} color="#8A8A8A" />}
          returnKeyType="search"
        />
      </View>

      <View className="mt-3 px-5">
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

      <View className="mt-3 px-5">
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
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}
        renderItem={({ item }) => <RestaurantCard restaurant={item} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center py-20">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-dime-bg-2">
                <Icon name="magnifyingglass" size={28} color="#BFBFBF" />
              </View>
              <Text className="text-[17px] font-bold text-dime-ink" style={{ letterSpacing: -0.3 }}>
                No results
              </Text>
              <Text className="mt-1 text-[14px] text-dime-ink-3">Try another cuisine or clear filters.</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}
