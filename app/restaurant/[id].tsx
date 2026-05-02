import { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  DottedUnderline,
  Icon,
  ScriptBadge,
  SegmentedTabs,
  Sheet,
  haptic,
  type SegmentedTab,
} from "@/components/ui";
import {
  useActiveOffers,
  useMenu,
  useRestaurant,
  useReviewBreakdown,
  useReviews,
  useSimilarRestaurants,
} from "@/hooks/queries";
import { EditorialGallery } from "@/components/restaurant/EditorialGallery";
import { OfferCoupon } from "@/components/restaurant/OfferCoupon";
import { SampleBill } from "@/components/restaurant/SampleBill";
import { ReviewRow } from "@/components/restaurant/ReviewRow";
import { ReviewSummary } from "@/components/restaurant/ReviewSummary";
import { AskAnythingPanel, AISparkle } from "@/components/restaurant/AskAnythingPanel";
import { MenuList } from "@/components/restaurant/MenuList";
import { StickyPayBar } from "@/components/restaurant/StickyPayBar";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { surface } from "@/lib/visual";
import { rupees } from "@/lib/format";
import { useToast } from "@/store/toast";
import type { Tables } from "@/lib/supabase";

type TabKey = "offers" | "menu" | "ask" | "reviews" | "facilities";

const AMENITY_ICON: Record<string, string> = {
  wifi: "wifi",
  "wi-fi": "wifi",
  valet: "car.fill",
  parking: "car.fill",
  outdoor: "leaf.fill",
  "outdoor seating": "leaf.fill",
  rooftop: "leaf.fill",
  family: "person.fill",
  "family friendly": "person.fill",
  "live music": "music.note",
  music: "music.note",
  pet: "pawprint.fill",
  "pet friendly": "pawprint.fill",
  wheelchair: "figure.roll",
  "wheelchair accessible": "figure.roll",
  cards: "creditcard.fill",
  "cards accepted": "creditcard.fill",
  bar: "wineglass.fill",
  ac: "snowflake",
  smoking: "smoke.fill",
};

function amenityIcon(name: string): string {
  return AMENITY_ICON[name.toLowerCase()] ?? "checkmark.seal.fill";
}

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const toast = useToast((s) => s);

  const { data: r, isLoading } = useRestaurant(id);
  const { data: menu } = useMenu(id);
  const { data: offers } = useActiveOffers(id);
  const { data: reviews } = useReviews(id);
  const { data: breakdown } = useReviewBreakdown(id);
  const { data: similar } = useSimilarRestaurants(id);

  const [tab, setTab] = useState<TabKey>("offers");
  const [bookmarked, setBookmarked] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const open = (() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined>)?.[day];
    if (!h) return false;
    const [nh, nm] = [new Date().getHours(), new Date().getMinutes()];
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    const now = nh * 60 + nm;
    return now >= (oh! * 60 + om!) && now <= (ch! * 60 + cm!);
  })();

  const galleryImages = useMemo(() => {
    if (!r) return [] as string[];
    const urls = (r.gallery_urls && r.gallery_urls.length ? r.gallery_urls : r.gallery_images) ?? [];
    const all = [r.cover_image_url, ...urls].filter((u): u is string => !!u);
    return Array.from(new Set(all));
  }, [r]);

  const groups = useMemo(() => {
    if (!menu) return [];
    return menu.categories
      .map((c) => ({
        category: c,
        items: menu.items.filter((i) => i.category_id === c.id && i.is_available),
      }))
      .filter((g) => g.items.length > 0);
  }, [menu]);

  const cost = r?.cost_for_two ?? 1200;
  const cuisines = r?.cuisines?.join(", ") ?? "";
  const locality = r?.address?.split(",")[0]?.trim() ?? "";
  const distance = r?.distance_km;
  const cashbackPct = r?.cashback_pct ?? 20;
  const closeTime = (() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined>)?.[day];
    if (!h) return "";
    return formatTime(h.close);
  })();
  const openTime = (() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined>)?.[day];
    if (!h) return "";
    return formatTime(h.open);
  })();

  if (!r && !isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-dime-bg">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-dime-ink">Restaurant not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs: SegmentedTab[] = [
    { key: "offers", label: "Offers" },
    { key: "menu", label: "Menu" },
    { key: "ask", label: "Ask anything", badgeNode: <ScriptBadge label="New" height={16} /> },
    { key: "reviews", label: "Reviews" },
    { key: "facilities", label: "Facilities" },
  ];

  const onCall = () => {
    haptic.light();
    if (r?.phone) Linking.openURL(`tel:${r.phone}`);
    else toast.warn("No phone on file");
  };
  const onDirections = () => {
    haptic.light();
    if (r?.address) Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`);
  };
  const onWhatsGood = () => {
    haptic.success();
    setTab("ask");
  };

  return (
    <View style={{ flex: 1 }} className="bg-dime-bg">
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }} className="bg-dime-bg">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
          <EditorialGallery
            images={galleryImages}
            onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
            onBookmark={() => setBookmarked((b) => !b)}
            onShare={() => toast.info("Share coming soon")}
            onOpenGallery={() => setGalleryOpen(true)}
            bookmarked={bookmarked}
          />

          {/* Identity block */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  className="text-dime-ink"
                  style={{ fontSize: 26, fontWeight: "700", letterSpacing: -0.4 }}
                >
                  {r?.name}
                </Text>
              </View>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: "#16A34A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Icon name="star.fill" size={11} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                    {Number(r?.rating ?? 0).toFixed(1)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 9,
                    fontWeight: "700",
                    marginTop: 2,
                    letterSpacing: 0.4,
                  }}
                >
                  {r?.review_count ?? 0}
                </Text>
              </View>
            </View>

            <Text className="text-dime-ink-2" style={{ marginTop: 8, fontSize: 13 }}>
              {cuisines}
              {cuisines ? " · " : ""}
              {rupees(cost)} for two
            </Text>

            <View
              style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 }}
            >
              <Text className="text-dime-ink-3" style={{ fontSize: 13 }}>
                {distance != null ? `${Number(distance).toFixed(1)}km · ` : ""}
                {locality}
                {locality ? ", " : ""}
              </Text>
              <Pressable
                onPress={() => {
                  haptic.light();
                  toast.info("City switcher coming soon");
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <DottedUnderline className="text-dime-ink" style={{ fontSize: 13, fontWeight: "600" }}>
                  {r?.city ?? "Bangalore"}
                </DottedUnderline>
                <Icon name="chevron.down" size={11} color={isDark ? "#fff" : "#1C1C1E"} />
              </Pressable>
            </View>

            <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: open ? "#22C55E" : "#EF4444",
                }}
              />
              <Text className="text-dime-ink-3" style={{ fontSize: 13 }}>
                {open ? "Open" : "Closed"} ·{" "}
              </Text>
              <Text className="text-dime-ink-3" style={{ fontSize: 13 }}>
                {openTime || "—"} to{" "}
              </Text>
              <Pressable
                onPress={() => {
                  haptic.light();
                  toast.info("Hours coming soon");
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <DottedUnderline className="text-dime-ink" style={{ fontSize: 13, fontWeight: "600" }}>
                  {closeTime || "—"}
                </DottedUnderline>
                <Icon name="chevron.down" size={11} color={isDark ? "#fff" : "#1C1C1E"} />
              </Pressable>
            </View>
          </View>

          {/* Action pill row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 18,
              gap: 10,
            }}
          >
            <ActionPill onPress={onWhatsGood} leading={<AISparkle size={16} />} label="What's good here?" />
            <ActionPill onPress={onDirections} icon="map.fill" label="Directions" />
            <ActionPill onPress={onCall} icon="phone.fill" label="Call" />
          </ScrollView>

          {/* Tabs */}
          <View style={{ paddingHorizontal: 12 }}>
            <SegmentedTabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} />
          </View>

          {/* Tab panels */}
          <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 18 }}>
            {tab === "offers" ? (
              <OffersPanel
                onBookOffer={(offerId) =>
                  router.push({
                    pathname: "/booking/new",
                    params: { restaurantId: id!, offer: offerId ?? "" },
                  })
                }
                onCalculate={() => setSavingsOpen(true)}
                offerCount={offers?.length ?? 0}
              />
            ) : null}

            {tab === "menu" ? (
              <MenuList
                groups={groups}
                onItemPress={() => {
                  haptic.light();
                  router.push({ pathname: "/menu/[id]", params: { id: id! } });
                }}
              />
            ) : null}

            {tab === "ask" ? (
              <View style={{ gap: 22 }}>
                <AskAnythingPanel />
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      className="text-dime-ink"
                      style={{ fontSize: 18, fontWeight: "700" }}
                    >
                      Reviews
                    </Text>
                    <Pressable onPress={() => setTab("reviews")}>
                      <DottedUnderline className="text-dime-ink-2" style={{ fontSize: 13, fontWeight: "600" }}>
                        See all
                      </DottedUnderline>
                    </Pressable>
                  </View>
                  <ReviewSummary
                    overall={breakdown?.overall ?? Number(r?.rating ?? 0)}
                    totalReviews={breakdown?.total ?? r?.review_count ?? 0}
                    axes={[
                      { label: "Food", value: breakdown?.food ?? 0 },
                      { label: "Beverages", value: breakdown?.beverages ?? 0 },
                      { label: "Service", value: breakdown?.service ?? 0 },
                    ]}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ marginTop: 14, gap: 12 }}
                  >
                    {(reviews ?? []).slice(0, 2).map((rev) => (
                      <View key={rev.id} style={{ width: 320 }}>
                        <ReviewRow review={rev} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : null}

            {tab === "reviews" ? (
              <ReviewsPanel
                breakdown={breakdown}
                fallbackOverall={Number(r?.rating ?? 0)}
                fallbackTotal={r?.review_count ?? 0}
                reviews={reviews ?? []}
              />
            ) : null}

            {tab === "facilities" ? (
              <FacilitiesPanel
                amenities={r?.amenities ?? []}
                similar={similar ?? []}
                onOrderOnline={() => {
                  haptic.light();
                  router.push({ pathname: "/menu/[id]", params: { id: id! } });
                }}
              />
            ) : null}
          </View>
        </ScrollView>

        <StickyPayBar
          cashbackPct={cashbackPct}
          onBook={() =>
            router.push({ pathname: "/booking/new", params: { restaurantId: id! } })
          }
          onPay={() => router.push("/scan")}
          onCashbackPress={() => toast.info(`Earn ${cashbackPct}% cashback on this bill`)}
        />
      </SafeAreaView>

      <Sheet visible={savingsOpen} onClose={() => setSavingsOpen(false)} maxHeight="60%">
        <Sheet.Body>
          <Text className="text-dime-ink" style={{ fontSize: 18, fontWeight: "700" }}>
            Calculate savings
          </Text>
          <Text className="text-dime-ink-3" style={{ marginTop: 6, fontSize: 13 }}>
            Live savings calculator is coming soon. Pre-bookings already include the
            highlighted offer applied automatically at the table.
          </Text>
        </Sheet.Body>
      </Sheet>

      <Sheet visible={galleryOpen} onClose={() => setGalleryOpen(false)} maxHeight="80%">
        <Sheet.Body>
          <Text className="text-dime-ink" style={{ fontSize: 18, fontWeight: "700" }}>
            Gallery
          </Text>
          <Text className="text-dime-ink-3" style={{ marginTop: 4, fontSize: 13 }}>
            {galleryImages.length} photo{galleryImages.length === 1 ? "" : "s"}
          </Text>
          <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ gap: 10 }}>
            {galleryImages.map((u, i) => (
              <Image
                key={i}
                source={{ uri: u }}
                style={{
                  width: "100%",
                  height: 220,
                  borderRadius: 16,
                  backgroundColor: "#222",
                }}
              />
            ))}
          </ScrollView>
        </Sheet.Body>
      </Sheet>
    </View>
  );
}

function ActionPill({
  label,
  icon,
  leading,
  onPress,
}: {
  label: string;
  icon?: string;
  leading?: React.ReactNode;
  onPress?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
        backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      }}
    >
      {leading ?? (icon ? <Icon name={icon} size={16} color="#FC8019" /> : null)}
      <Text style={{ fontSize: 14, fontWeight: "600" }} className="text-dime-ink">
        {label}
      </Text>
    </Pressable>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  const hr = h ?? 0;
  const min = m ?? 0;
  const suffix = hr >= 12 ? "PM" : "AM";
  const disp = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${disp}:${min.toString().padStart(2, "0")} ${suffix}`;
}

function OffersPanel({
  offerCount,
  onBookOffer,
  onCalculate,
}: {
  offerCount: number;
  onBookOffer: (offerId: string | null) => void;
  onCalculate: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const toast = useToast((s) => s);
  const [meal, setMeal] = useState<"lunch" | "dinner" | "late-night">("dinner");
  const labelFor = (m: typeof meal) => (m === "lunch" ? "lunch" : m === "dinner" ? "dinner" : "late-night");

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
        <Text className="text-dime-ink" style={{ fontSize: 20, fontWeight: "700" }}>
          Offers for today,{" "}
        </Text>
        <Pressable
          onPress={() => {
            haptic.select();
            setMeal((m) => (m === "lunch" ? "dinner" : m === "dinner" ? "late-night" : "lunch"));
            toast.info(`Showing ${labelFor(meal === "lunch" ? "dinner" : meal === "dinner" ? "late-night" : "lunch")}`);
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
        >
          <DottedUnderline
            className="text-dime-ink"
            style={{ fontSize: 20, fontWeight: "700" }}
          >
            {labelFor(meal)}
          </DottedUnderline>
          <Icon name="chevron.down" size={14} color={isDark ? "#fff" : "#1C1C1E"} />
        </Pressable>
      </View>

      <OfferCoupon
        headline="FLAT 15% OFF"
        freebie="+ free mocktail(s)"
        windowText="From 7:45 PM, today"
        metaText="19 slots left | Cover charge ₹25"
        ctaLabel="Book now"
        onPress={() => onBookOffer(null)}
      />

      {offerCount > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
          <View style={{ width: 16, height: 4, borderRadius: 2, backgroundColor: "#FC8019" }} />
          <View
            style={{
              width: 6,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)",
            }}
          />
        </View>
      ) : null}

      <SectionLabel label="+ Add-on benefits" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {[
          { name: "Welcome Offer", value: "Flat ₹250 OFF", icon: "gift.fill", color: "#FC8019" },
          { name: "Bank", value: "25% off (HDFC)", icon: "creditcard.fill", color: "#3B82F6" },
          { name: "Loyalty", value: "Earn 2x points", icon: "crown.fill", color: "#FFA500" },
          { name: "Dine Pass", value: "Free dessert", icon: "leaf.fill", color: "#22C55E" },
        ].map((a) => (
          <View
            key={a.name}
            style={{
              width: 240,
              minHeight: 72,
              borderRadius: 16,
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${a.color}1F`,
              }}
            >
              <Icon name={a.icon} size={16} color={a.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-dime-ink-3" style={{ fontSize: 11, fontWeight: "600" }}>
                {a.name}
              </Text>
              <Text className="text-dime-ink" style={{ fontSize: 14, fontWeight: "600" }}>
                {a.value}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <SectionLabel label="Sample bill" />
      <SampleBill
        estimatedBill={1200}
        payable={785}
        saveUpTo={435}
        cashback={153}
        guests={2}
        onCalculate={onCalculate}
      />
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text className="text-dime-ink" style={{ fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: isDark ? surface.hairlineDark : surface.hairlineLight,
        }}
      />
    </View>
  );
}

function ReviewsPanel({
  breakdown,
  fallbackOverall,
  fallbackTotal,
  reviews,
}: {
  breakdown: { food: number; beverages: number; service: number; overall: number; total: number } | undefined;
  fallbackOverall: number;
  fallbackTotal: number;
  reviews: (Tables<"reviews"> & { users: { name: string | null; avatar_url: string | null } })[];
}) {
  const [filter, setFilter] = useState<"all" | "recent" | "photos" | "5" | "4" | "3">("all");
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const toast = useToast((s) => s);

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter === "recent") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [reviews, filter]);

  const filterChips: Array<{ key: typeof filter; label: string }> = [
    { key: "all", label: "All" },
    { key: "recent", label: "Most recent" },
    { key: "photos", label: "With photos" },
    { key: "5", label: "5★" },
    { key: "4", label: "4★" },
    { key: "3", label: "3★" },
  ];

  return (
    <View style={{ gap: 16 }}>
      <ReviewSummary
        overall={breakdown?.overall || fallbackOverall}
        totalReviews={breakdown?.total ?? fallbackTotal}
        axes={[
          { label: "Food", value: breakdown?.food ?? 0 },
          { label: "Beverages", value: breakdown?.beverages ?? 0 },
          { label: "Service", value: breakdown?.service ?? 0 },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {filterChips.map((c) => {
          const active = filter === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => {
                haptic.select();
                if (c.key === "all" || c.key === "recent") {
                  setFilter(c.key);
                } else {
                  toast.info("Filter coming soon");
                }
              }}
              style={{
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
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: active ? "#FC8019" : isDark ? "#fff" : "#1C1C1E",
                }}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 12 }}>
        {filtered.length === 0 ? (
          <Text className="text-dime-ink-3" style={{ fontSize: 13 }}>
            No reviews yet — be the first to share.
          </Text>
        ) : (
          filtered.map((rev) => <ReviewRow key={rev.id} review={rev} />)
        )}
      </View>
    </View>
  );
}

function FacilitiesPanel({
  amenities,
  similar,
  onOrderOnline,
}: {
  amenities: string[];
  similar: Tables<"restaurants">[];
  onOrderOnline: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return (
    <View style={{ gap: 18 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {amenities.length === 0 ? (
          <Text className="text-dime-ink-3" style={{ fontSize: 13 }}>
            No facilities listed.
          </Text>
        ) : (
          amenities.map((a) => (
            <View
              key={a}
              style={{
                width: 90,
                height: 90,
                borderRadius: 20,
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Icon name={amenityIcon(a)} size={22} color="#FC8019" />
              <Text
                className="text-dime-ink-2"
                style={{ fontSize: 11, textAlign: "center", paddingHorizontal: 4 }}
                numberOfLines={2}
              >
                {a}
              </Text>
            </View>
          ))
        )}
      </View>

      <SectionLabel label="Similar restaurants" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {similar.map((s) => (
          <RestaurantCard key={s.id} restaurant={s} variant="compact" />
        ))}
      </ScrollView>

      <View
        style={{
          marginTop: 4,
          padding: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? surface.hairlineDark : surface.hairlineLight,
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(252,128,25,0.16)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="bag.fill" size={18} color="#FC8019" />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-dime-ink" style={{ fontSize: 14, fontWeight: "700" }}>
            Looking to get food delivery?
          </Text>
          <Text className="text-dime-ink-3" style={{ fontSize: 12, marginTop: 2 }}>
            Switch to Order Online for delivery.
          </Text>
        </View>
        <Pressable
          onPress={onOrderOnline}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "#FC8019",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Order ›</Text>
        </Pressable>
      </View>
    </View>
  );
}
