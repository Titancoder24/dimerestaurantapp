import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  DottedUnderline,
  Header,
  Icon,
  Input,
  Screen,
  SegmentedTabs,
  haptic,
} from "@/components/ui";
import { useDineoutRestaurants } from "@/hooks/queries";
import { DineoutCard } from "@/components/restaurant/DineoutCard";
import { surface } from "@/lib/visual";
import { useToast } from "@/store/toast";

const cuisineFilters = ["North Indian", "Italian", "Japanese", "Continental", "Pizza", "Mughlai", "Vegan"];

type FilterChip =
  | { key: "filter"; label: string; icon: string; kind: "filter" }
  | { key: "sort"; label: string; trailing: string; kind: "sort" }
  | { key: "table"; label: string; kind: "table" }
  | { key: "within"; label: string; kind: "within" }
  | { key: "rating"; label: string; kind: "rating" }
  | { key: "veg"; label: string; kind: "veg" }
  | { key: "alcohol"; label: string; kind: "alcohol" }
  | { key: string; label: string; kind: "cuisine" };

export default function Discover() {
  const params = useLocalSearchParams<{ q?: string; city?: string }>();
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const toast = useToast((s) => s);

  const [mode, setMode] = useState<"online" | "dineout">("dineout");
  const [search, setSearch] = useState("");
  const [withinKm, setWithinKm] = useState(false);
  const [minRating, setMinRating] = useState(false);
  const [pureVeg, setPureVeg] = useState(false);
  const [servesAlcohol, setServesAlcohol] = useState(false);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [city] = useState<string>(params.city ?? "Bangalore");

  const filters = useMemo(
    () => ({
      city: undefined as string | undefined,
      withinKm: withinKm ? 5 : undefined,
      minRating: minRating ? 4 : 0,
      pureVeg,
      servesAlcohol,
      cuisine: cuisine ?? undefined,
      search: search.trim() || undefined,
    }),
    [withinKm, minRating, pureVeg, servesAlcohol, cuisine, search]
  );

  const { data: restaurants, isLoading } = useDineoutRestaurants(filters);

  const cols = width >= 768 ? 3 : 2;
  const list = restaurants ?? [];

  const chips: FilterChip[] = [
    { key: "filter", label: "Filter", icon: "slider.horizontal.3", kind: "filter" },
    { key: "sort", label: "Sort By", trailing: "chevron.down", kind: "sort" },
    { key: "table", label: "Book a table", kind: "table" },
    { key: "within", label: "Within 5km", kind: "within" },
    { key: "rating", label: "Rating 4+", kind: "rating" },
    { key: "veg", label: "Pure Veg", kind: "veg" },
    { key: "alcohol", label: "Serves Alcohol", kind: "alcohol" },
    ...cuisineFilters.map((c) => ({ key: c, label: c, kind: "cuisine" as const })),
  ];

  const isChipActive = (c: FilterChip) => {
    if (c.kind === "within") return withinKm;
    if (c.kind === "rating") return minRating;
    if (c.kind === "veg") return pureVeg;
    if (c.kind === "alcohol") return servesAlcohol;
    if (c.kind === "cuisine") return cuisine === c.key;
    return false;
  };

  const onChipPress = (c: FilterChip) => {
    haptic.select();
    switch (c.kind) {
      case "filter":
        toast.info("Filter sheet coming soon");
        break;
      case "sort":
        toast.info("Sort options coming soon");
        break;
      case "table":
        toast.info("Already on Dineout");
        break;
      case "within":
        setWithinKm((v) => !v);
        break;
      case "rating":
        setMinRating((v) => !v);
        break;
      case "veg":
        setPureVeg((v) => !v);
        break;
      case "alcohol":
        setServesAlcohol((v) => !v);
        break;
      case "cuisine":
        setCuisine((v) => (v === c.key ? null : c.key));
        break;
    }
  };

  return (
    <Screen scroll={false}>
      <Header
        title="Dineout"
        subtitle={`${list.length} restaurants in ${city}`}
        right={
          <Pressable
            onPress={() => {
              haptic.light();
              toast.info("City switcher coming soon");
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            hitSlop={8}
          >
            <Icon name="location.fill" size={14} color="#FC8019" />
            <DottedUnderline className="text-dime-ink" style={{ fontSize: 13, fontWeight: "600" }}>
              {city}
            </DottedUnderline>
            <Icon name="chevron.down" size={12} color={isDark ? "#fff" : "#1C1C1E"} />
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 16 }}>
        <SegmentedTabs
          tabs={[
            { key: "online", label: "Order Online" },
            { key: "dineout", label: "Dineout" },
          ]}
          active={mode}
          scrollable={false}
          onChange={(k) => {
            if (k === "online") {
              toast.info("Order Online", "Coming soon — currently showing Dineout.");
              return;
            }
            setMode(k as "online" | "dineout");
          }}
        />
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Input
          placeholder="Search restaurants & cuisines"
          value={search}
          onChangeText={setSearch}
          leading={<Icon name="magnifyingglass" size={18} color="#8E8E93" />}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {chips.map((c) => {
          const active = isChipActive(c);
          return (
            <Pressable
              key={c.key}
              onPress={() => onChipPress(c)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active
                  ? "#FC8019"
                  : isDark
                  ? surface.hairlineDark
                  : surface.hairlineLight,
                backgroundColor: active
                  ? "rgba(252,128,25,0.14)"
                  : isDark
                  ? "#1C1C1E"
                  : "#FFFFFF",
              }}
            >
              {"icon" in c && c.icon ? (
                <Icon name={c.icon} size={14} color={active ? "#FC8019" : isDark ? "#fff" : "#1C1C1E"} />
              ) : null}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: active ? "#FC8019" : isDark ? "#fff" : "#1C1C1E",
                }}
              >
                {c.label}
              </Text>
              {"trailing" in c && c.trailing ? (
                <Icon name={c.trailing} size={12} color={active ? "#FC8019" : isDark ? "#fff" : "#1C1C1E"} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={list}
        key={cols}
        numColumns={cols}
        keyExtractor={(r) => r.id}
        columnWrapperStyle={{ gap: 12, justifyContent: "flex-start" }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 96,
          gap: 14,
        }}
        renderItem={({ item }) => <DineoutCard restaurant={item} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={{ alignItems: "center", paddingVertical: 64 }}>
              <Icon name="magnifyingglass" size={32} color="#C7C7CC" />
              <Text className="text-dime-ink" style={{ marginTop: 12, fontSize: 15, fontWeight: "600" }}>
                No restaurants found
              </Text>
              <Text className="text-dime-ink-3" style={{ marginTop: 4, fontSize: 13 }}>
                Try clearing filters or another cuisine.
              </Text>
            </View>
          )
        }
      />
    </Screen>
  );
}
