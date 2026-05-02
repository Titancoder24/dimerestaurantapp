import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Chip,
  DottedUnderline,
  Icon,
  Input,
  Screen,
  SegmentedTabs,
  haptic,
} from "@/components/ui";
import { useDineoutRestaurants, type DineoutFilters } from "@/hooks/queries";
import { DineoutCard } from "@/components/restaurant/DineoutCard";
import { useToast } from "@/store/toast";
import { useBreakpoint } from "@/lib/responsive";
import { surface } from "@/lib/visual";
import { HeroBanner } from "@/components/web/HeroBanner";
import { SEOContent } from "@/components/web/SEOContent";
import { AppDownloadBand } from "@/components/web/AppDownloadBand";
import { LinkChipGrid } from "@/components/web/LinkChipGrid";
import { WebFooter } from "@/components/web/WebFooter";

const cuisines = ["All", "North Indian", "Italian", "Japanese", "Chinese", "Continental", "Pizza", "Mughlai"];
const modeTabs = [
  { key: "online", label: "Order Online" },
  { key: "dineout", label: "Dineout" },
];

const LOCALITIES = [
  "Magadi Road", "Maruti Nagar", "Yelahanka", "Kanchipuram", "Central Bangalore",
  "Murugeshpalya", "Hennur", "Kunigal", "Kadubeesanahalli", "Bidadi", "Navarathna Agrahara",
];

const TOP_CUISINES = [
  "American", "Andhra", "Arabian", "Asian", "Awadhi", "BBQ",
  "Bakery", "Bar Food", "Bengali", "Beverages", "Bihari",
];

const NEAR_ME = TOP_CUISINES.map((c) => `${c} near me`);

export default function Discover() {
  const params = useLocalSearchParams<{ q?: string }>();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const toast = useToast();

  const [mode, setMode] = useState("dineout");
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState<string>("All");
  const [withinKm, setWithinKm] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [pureVeg, setPureVeg] = useState(false);
  const [servesAlcohol, setServesAlcohol] = useState(false);
  const [page, setPage] = useState(1);

  const filters: DineoutFilters = useMemo(() => ({
    cuisine,
    withinKm,
    minRating,
    pureVeg,
    servesAlcohol,
    search: search.trim() || undefined,
  }), [cuisine, withinKm, minRating, pureVeg, servesAlcohol, search]);

  const { data: restaurants, isLoading } = useDineoutRestaurants(filters);

  const filtered = useMemo(() => {
    let list = restaurants ?? [];
    if (params.q && params.q !== "fine_dine") {
      const q = String(params.q).toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
        (r.city ?? "").toLowerCase().includes(q),
      );
    }
    if (params.q === "fine_dine") list = list.filter((r) => r.type === "fine_dine");
    return list;
  }, [restaurants, params.q]);

  const visible = isWeb && isDesktop ? filtered.slice(0, page * 21) : filtered;

  /* ----------------------------- WEB DESKTOP/TABLET LAYOUT ----------------------------- */
  if (isWeb && (isDesktop || isTablet)) {
    const cols = isDesktop ? 3 : 2;
    const gap = 16;
    const cellWidth = `calc(${100 / cols}% - ${(gap * (cols - 1)) / cols}px)` as unknown as number;

    return (
      <Screen>
        <View style={{ paddingHorizontal: 24, maxWidth: 1200, width: "100%", alignSelf: "center" }}>
          <HeroBanner city="Bangalore" count={filtered.length} />

          <View style={{ marginTop: 18 }}>
            <SegmentedTabs
              variant="web"
              tabs={modeTabs}
              active={mode}
              onChange={(k) => {
                if (k === "online") {
                  haptic.light();
                  toast.success("Coming soon", "Order online is rolling out shortly.");
                  return;
                }
                setMode(k);
              }}
              scrollable={false}
            />
          </View>

          <View style={{ marginTop: 16 }}>
            <Input
              placeholder="Search restaurants & cuisines"
              value={search}
              onChangeText={setSearch}
              leading={<Icon name="magnifyingglass" size={16} color={surface.ink3} />}
              returnKeyType="search"
            />
          </View>

          <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip label="Filter" leading={<Icon name="slider.horizontal.3" size={11} color={surface.ink} />} onPress={() => toast.success("Coming soon", "Advanced filters")} />
            <Chip label="Sort By" onPress={() => toast.success("Coming soon", "Sort options")} />
            <Chip label="Within 5km" selected={withinKm === 5} onPress={() => setWithinKm((v) => v === 5 ? undefined : 5)} />
            <Chip label="Rating 4+" selected={minRating === 4} onPress={() => setMinRating((v) => v === 4 ? undefined : 4)} />
            <Chip label="Pure Veg" selected={pureVeg} onPress={() => setPureVeg((v) => !v)} />
            <Chip label="Serves Alcohol" selected={servesAlcohol} onPress={() => setServesAlcohol((v) => !v)} />
            {cuisines.map((c) => (
              <Chip key={c} label={c} selected={cuisine === c} onPress={() => setCuisine(c)} />
            ))}
          </View>

          <Text style={{ marginTop: 18, fontSize: 13, color: surface.ink3 }}>
            {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} in Bangalore
          </Text>

          <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap }}>
            {visible.map((r) => (
              <View key={r.id} style={{ width: cellWidth }}>
                <DineoutCard restaurant={r} variant="web" />
              </View>
            ))}
          </View>

          {visible.length < filtered.length ? (
            <View style={{ alignItems: "center", marginTop: 24 }}>
              <Pressable
                onPress={() => { haptic.light(); setPage((p) => p + 1); }}
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 12,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: "#FC8019",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#FC8019" }}>Show more restaurants</Text>
              </Pressable>
            </View>
          ) : null}

          {filtered.length === 0 && !isLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <View
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Icon name="magnifyingglass" size={22} color={surface.ink3} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: surface.ink }}>No results found</Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: surface.ink3 }}>Try another cuisine or clear filters.</Text>
            </View>
          ) : null}

          <SEOContent city="Bangalore" />
          <AppDownloadBand />
          <LinkChipGrid title="Explore localities in and around Bangalore" items={LOCALITIES.map((l) => ({ label: l, href: `/discover?q=${l}` }))} />
          <LinkChipGrid title="Explore Top Cuisine Dining Spots in Bangalore" items={TOP_CUISINES.map((l) => ({ label: l, href: `/discover?q=${l}` }))} />
          <LinkChipGrid title="More Cuisines Restaurants Options Near Me" items={NEAR_ME.map((l) => ({ label: l, href: `/discover?q=${l.replace(" near me", "")}` }))} />
          <WebFooter />
        </View>
      </Screen>
    );
  }

  /* ----------------------------- MOBILE LAYOUT ----------------------------- */
  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: "#fff" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: surface.ink, letterSpacing: -0.5 }}>Dineout</Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: surface.ink3 }}>
              {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} in{" "}
              <Text style={{ color: surface.ink, fontWeight: "600" }}>Bangalore</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => { haptic.light(); toast.success("Coming soon", "City switcher"); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Icon name="mappin" size={13} color="#FC8019" />
            <DottedUnderline textStyle={{ fontSize: 13, fontWeight: "600", color: surface.ink }}>
              Bangalore
            </DottedUnderline>
            <Icon name="chevron.down" size={10} color={surface.ink3} />
          </Pressable>
        </View>
      </View>

      <SegmentedTabs
        tabs={modeTabs}
        active={mode}
        onChange={(k) => {
          if (k === "online") {
            haptic.light();
            toast.success("Coming soon", "Order online is rolling out shortly.");
            return;
          }
          setMode(k);
        }}
        scrollable={false}
      />

      <View style={{ paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff" }}>
        <Input
          placeholder="Search restaurants & cuisines"
          value={search}
          onChangeText={setSearch}
          leading={<Icon name="magnifyingglass" size={16} color={surface.ink3} />}
          returnKeyType="search"
        />
      </View>

      <View style={{ paddingTop: 10, paddingBottom: 6, backgroundColor: "#fff" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Chip label="Filter" leading={<Icon name="slider.horizontal.3" size={11} color={surface.ink} />} onPress={() => toast.success("Coming soon", "Advanced filters")} />
          <Chip label="Sort By" onPress={() => toast.success("Coming soon", "Sort options")} />
          <Chip label="Within 5km" selected={withinKm === 5} onPress={() => setWithinKm((v) => v === 5 ? undefined : 5)} />
          <Chip label="Rating 4+" selected={minRating === 4} onPress={() => setMinRating((v) => v === 4 ? undefined : 4)} />
          <Chip label="Pure Veg" selected={pureVeg} onPress={() => setPureVeg((v) => !v)} />
          <Chip label="Serves Alcohol" selected={servesAlcohol} onPress={() => setServesAlcohol((v) => !v)} />
          {cuisines.map((c) => (
            <Chip key={c} label={c} selected={cuisine === c} onPress={() => setCuisine(c)} />
          ))}
        </ScrollView>
      </View>

      <View style={{ height: 8, backgroundColor: surface.divider }} />

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 100, gap: 12, backgroundColor: "#fff" }}
        renderItem={({ item }) => (
          <View style={{ width: "48%", flexGrow: 0 }}>
            <DineoutCard restaurant={item} />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <View
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: surface.divider, alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Icon name="magnifyingglass" size={22} color={surface.ink3} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: surface.ink }}>No results found</Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: surface.ink3 }}>Try another cuisine or clear filters.</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}
