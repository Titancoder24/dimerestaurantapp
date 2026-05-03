import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon, Screen, haptic } from "@/components/ui";
import { useDineoutRestaurants, type DineoutFilters, type DineoutRestaurant } from "@/hooks/queries";
import { useToast } from "@/store/toast";
import { T } from "@/lib/visual";
import { Img, Pill, StarChip, Chip, display, mono, num } from "@/components/dime/atoms";

export default function Discover() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const toast = useToast();

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filters: DineoutFilters = useMemo(() => ({
    cuisine: filter === "all" || ["sort by", "within 5km", "rating 4+", "pure veg", "serves alcohol"].includes(filter)
      ? undefined
      : filter,
    minRating: filter === "rating 4+" ? 4 : undefined,
    pureVeg: filter === "pure veg",
    servesAlcohol: filter === "serves alcohol",
    withinKm: filter === "within 5km" ? 5 : undefined,
    search: search.trim() || undefined,
  }), [filter, search]);

  const { data: restaurants, isLoading } = useDineoutRestaurants(filters);
  const list = useMemo(() => {
    let l = restaurants ?? [];
    if (params.q) {
      const q = String(params.q).toLowerCase();
      l = l.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q))
      );
    }
    return l;
  }, [restaurants, params.q]);

  return (
    <Screen scroll={false} className="bg-[#F6F2EC]">
      <View style={{ paddingTop: 14, paddingHorizontal: 18, paddingBottom: 8, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View>
          <Text style={display(28, "600", -0.6)}>Dineout</Text>
          <Text style={[num(12, "500"), { color: T.muted, marginTop: 2 }]}>
            {list.length} restaurants · Bangalore
          </Text>
        </View>
        <Pressable
          onPress={() => { haptic.light(); toast.success("Coming soon", "City switcher"); }}
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
            backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
          }}
        >
          <Icon name="mappin" size={14} color={T.ink} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: T.ink }}>Bangalore</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12 }}>
        <View
          style={{
            height: 48, borderRadius: 14,
            backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
            flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10,
          }}
        >
          <Icon name="magnifyingglass" size={18} color={T.muted} />
          <Pressable
            style={{ flex: 1 }}
            onPress={() => { haptic.light(); toast.success("Coming soon", "Live search"); }}
          >
            <Text style={{ fontSize: 13, color: T.muted }}>Search restaurants & cuisines</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingBottom: 14 }}
      >
        <Pressable
          onPress={() => { haptic.light(); toast.success("Coming soon", "Advanced filters"); }}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
            backgroundColor: T.ink,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Icon name="slider.horizontal.3" size={14} color={T.cream} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: T.cream }}>Filter</Text>
        </Pressable>
        {["Sort By", "Within 5km", "Rating 4+", "Pure Veg", "Serves Alcohol", "All", "North Indian", "Italian", "Japanese"].map((c) => (
          <Chip
            key={c}
            active={c.toLowerCase() === filter || (c === "All" && filter === "all")}
            onPress={() => setFilter(c.toLowerCase())}
          >
            {c}
          </Chip>
        ))}
      </ScrollView>

      {/* Cards list */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, gap: 12, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {list.map((r) => (
          <DiscoverCard
            key={r.id}
            r={r as DineoutRestaurant}
            onPress={() => router.push({ pathname: "/restaurant/[id]", params: { id: r.id } })}
          />
        ))}
        {list.length === 0 && !isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <Icon name="magnifyingglass" size={28} color={T.muted} />
            <Text style={[display(18, "600", -0.3), { marginTop: 12 }]}>No results found</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: T.muted }}>Try another cuisine or clear filters.</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function DiscoverCard({ r, onPress }: { r: DineoutRestaurant; onPress: () => void }) {
  const cost = r.cost_for_two ?? 1200;
  const distance = r.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : null;
  const offer = r.pre_booking_discount_pct
    ? `Flat ${r.pre_booking_discount_pct}% off · pre-book`
    : `${r.cashback_pct ?? 25}% cashback`;
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: T.card, borderRadius: 16, overflow: "hidden",
        borderWidth: 1, borderColor: T.hairline,
      }}
    >
      <View style={{ position: "relative" }}>
        <Img uri={r.cover_image_url} kind="restaurant" h={170} w={"100%" as unknown as number} radius={0} hue={28} />
        {r.featured ? (
          <Pill
            bg={T.card}
            color={T.ink}
            size={10}
            style={{ position: "absolute", top: 12, left: 12 }}
            textStyle={{ letterSpacing: 1, textTransform: "uppercase", fontFamily: T.fontMono }}
            icon={<Icon name="star.fill" size={10} color={T.amber} />}
          >
            Featured
          </Pill>
        ) : null}
        <View style={{ position: "absolute", bottom: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StarChip score={Number(r.rating).toFixed(1)} />
          <Text
            style={[
              num(11, "600"),
              { color: "#fff", textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
            ]}
          >
            {r.review_count ?? 0}+ ratings
          </Text>
        </View>
        <Pressable
          style={{
            position: "absolute", top: 12, right: 12,
            width: 34, height: 34, borderRadius: 999,
            backgroundColor: T.card,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="heart" size={16} color={T.ink} />
        </Pressable>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={display(18, "600", -0.3)} numberOfLines={1}>{r.name}</Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
          {r.cuisines.slice(0, 4).join(" · ")}
        </Text>
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={num(12, "500")}>₹{cost.toLocaleString("en-IN")} for two</Text>
          <Text style={{ color: T.hairline, fontSize: 9 }}>•</Text>
          {distance ? <Text style={num(12, "500")}>{distance}</Text> : null}
          <Text style={{ color: T.hairline, fontSize: 9 }}>•</Text>
          <View
            style={{
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
              backgroundColor: T.forestSoft,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: T.forest }}>Table booking</Text>
          </View>
        </View>
        <View
          style={{
            marginTop: 10, paddingHorizontal: 10, paddingVertical: 8,
            borderRadius: 10, backgroundColor: T.cream,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Icon name="tag.fill" size={13} color={T.saffron} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: T.ink }}>{offer}</Text>
        </View>
      </View>
    </Pressable>
  );
}
