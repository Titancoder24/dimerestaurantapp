import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Chip,
  DottedUnderline,
  GlassButton,
  Icon,
  Screen,
  ScriptBadge,
  SegmentedTabs,
  Sheet,
  haptic,
} from "@/components/ui";
import {
  useRestaurant,
  useMenu,
  useActiveOffers,
  useReviews,
  useReviewBreakdown,
  useSimilarRestaurants,
  type DineoutRestaurant,
} from "@/hooks/queries";
import { useToast } from "@/store/toast";
import { rupees } from "@/lib/format";
import { surface, brand } from "@/lib/visual";
import { useBreakpoint } from "@/lib/responsive";
import { EditorialGallery } from "@/components/restaurant/EditorialGallery";
import { OfferCoupon } from "@/components/restaurant/OfferCoupon";
import { SampleBill } from "@/components/restaurant/SampleBill";
import { ReviewSummary } from "@/components/restaurant/ReviewSummary";
import { ReviewRow } from "@/components/restaurant/ReviewRow";
import { AskAnythingPanel, PulsingSparkle } from "@/components/restaurant/AskAnythingPanel";
import { MenuList } from "@/components/restaurant/MenuList";
import { StickyPayBar } from "@/components/restaurant/StickyPayBar";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { GradientSurface } from "@/components/ui";
import { useCart } from "@/store/cart";
import { WebFooter } from "@/components/web/WebFooter";

type TabKey = "offers" | "menu" | "ask" | "reviews" | "facilities";

const AMENITY_ICONS: Record<string, string> = {
  "wi-fi": "wifi", "wifi": "wifi",
  "valet": "car.fill", "valet parking": "car.fill",
  "outdoor seating": "leaf.fill", "outdoor": "leaf.fill",
  "family-friendly": "person.2.fill", "family friendly": "person.2.fill",
  "live music": "music.note",
  "pet-friendly": "pawprint.fill", "pet friendly": "pawprint.fill",
  "wheelchair": "figure.roll", "wheelchair accessible": "figure.roll",
  "cards": "creditcard.fill", "cards accepted": "creditcard.fill", "card payments": "creditcard.fill",
  "ac": "snowflake", "air conditioning": "snowflake",
  "smoking": "smoke.fill", "smoking area": "smoke.fill",
  "bar": "wineglass.fill", "full bar": "wineglass.fill",
  "rooftop": "building.2.fill",
};

function amenityIcon(label: string): string {
  return AMENITY_ICONS[label.toLowerCase()] ?? "checkmark.seal.fill";
}

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isWeb, isDesktop } = useBreakpoint();
  const startSession = useCart((s) => s.startSession);

  const { data: rRaw, isLoading } = useRestaurant(id);
  const r = rRaw as DineoutRestaurant | null | undefined;
  const { data: menu } = useMenu(id);
  const { data: offers } = useActiveOffers(id);
  const { data: reviews } = useReviews(id);
  const { data: breakdown } = useReviewBreakdown(id);
  const { data: similar } = useSimilarRestaurants(id);

  const [tab, setTab] = useState<TabKey>("offers");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [showCalcSheet, setShowCalcSheet] = useState(false);
  const [showGallerySheet, setShowGallerySheet] = useState(false);
  const lightboxRef = useRef<FlatList>(null);

  const galleryImages = useMemo(() => {
    if (!r) return [];
    const fromGallery = (r.gallery_urls ?? []).filter(Boolean);
    const fromLegacy = (r.gallery_images ?? []).filter(Boolean);
    return Array.from(new Set([
      r.cover_image_url,
      ...fromGallery,
      ...fromLegacy,
    ].filter(Boolean) as string[]));
  }, [r]);

  const allMenuPhotos = useMemo(() => {
    const photos: string[] = [];
    for (const item of menu?.items ?? []) for (const url of item.images) if (url) photos.push(url);
    return photos;
  }, [menu]);

  const lightboxPhotos = useMemo(() => [...galleryImages, ...allMenuPhotos], [galleryImages, allMenuPhotos]);
  const openLightbox = useCallback((url: string) => {
    const idx = lightboxPhotos.findIndex((p) => p === url);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }, [lightboxPhotos]);

  const open = (() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined> | undefined)?.[day];
    if (!h) return false;
    const [nh, nm] = [new Date().getHours(), new Date().getMinutes()];
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    const now = nh * 60 + nm;
    return now >= ((oh ?? 0) * 60 + (om ?? 0)) && now <= ((ch ?? 23) * 60 + (cm ?? 59));
  })();

  const hoursLabel = useMemo(() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined> | undefined)?.[day];
    if (!h) return "Hours unavailable";
    const fmt = (t: string) => {
      const [hh, mm] = t.split(":").map(Number);
      const hour12 = ((hh ?? 0) % 12) || 12;
      const ampm = (hh ?? 0) >= 12 ? "PM" : "AM";
      return `${hour12}:${String(mm ?? 0).padStart(2, "0")} ${ampm}`;
    };
    return `${fmt(h.open)} to ${fmt(h.close)}`;
  }, [r]);

  if (!r && !isLoading) return null;

  const ratingNum = Number(r?.rating ?? 0);
  const cost = (r?.cost_for_two ?? 1200);
  const distance = r?.distance_km ?? 9;
  const cashbackPct = r?.cashback_pct ?? 20;
  const estimatedBill = cost;
  const youPay = Math.round(cost * 0.65);
  const saveUpTo = Math.round(cost * 0.35);
  const cashback = Math.round(cost * (cashbackPct / 100) * 0.65);

  const tabs = [
    { key: "offers", label: "Offers" },
    { key: "menu", label: "Menu" },
    { key: "ask", label: "Ask anything", badgeNode: <ScriptBadge label="New" /> },
    { key: "reviews", label: "Reviews" },
    { key: "facilities", label: "Facilities" },
  ];

  const onAddMenuItem = (item: NonNullable<typeof menu>["items"][number]) => {
    if (r) startSession({ restaurantId: r.id, restaurantName: r.name });
    useCart.getState().addItem({
      menuItemId: item.id,
      name: item.name,
      unitPrice: Number(item.price),
      quantity: 1,
      addons: [],
      removed: [],
      image: item.images[0],
      isVeg: item.is_veg,
    });
    toast.success("Added to cart", item.name);
  };

  const tabPanel = (
    <View style={{ paddingTop: 18 }}>
      {tab === "offers" ? (
        <OffersTab
          offers={offers ?? []}
          estimatedBill={estimatedBill}
          youPay={youPay}
          saveUpTo={saveUpTo}
          cashback={cashback}
          onBookFromOffer={(offerId) =>
            router.push({ pathname: "/booking/new", params: { restaurantId: r!.id, offer: offerId } })
          }
          onCalculatePress={() => setShowCalcSheet(true)}
        />
      ) : null}

      {tab === "menu" ? (
        <MenuList data={menu} onAdd={onAddMenuItem} />
      ) : null}

      {tab === "ask" ? (
        <View>
          <AskAnythingPanel />
          <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: surface.ink, letterSpacing: -0.3 }}>Reviews</Text>
              <Pressable onPress={() => setTab("reviews")}>
                <DottedUnderline textStyle={{ fontSize: 13, fontWeight: "600", color: brand.orange500 }}>
                  See all
                </DottedUnderline>
              </Pressable>
            </View>
            {breakdown ? (
              <ReviewSummary
                overall={breakdown.overall || ratingNum}
                totalReviews={breakdown.total || (r?.review_count ?? 0)}
                axes={[
                  { label: "Food", value: breakdown.food },
                  { label: "Beverages", value: breakdown.beverages },
                  { label: "Service", value: breakdown.service },
                ]}
              />
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingTop: 16 }}
          >
            {(reviews ?? []).slice(0, 3).map((rev) => (
              <ReviewRow key={rev.id} review={rev} compact />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {tab === "reviews" ? (
        <View style={{ paddingHorizontal: 16 }}>
          {breakdown ? (
            <ReviewSummary
              overall={breakdown.overall || ratingNum}
              totalReviews={breakdown.total || (r?.review_count ?? 0)}
              axes={[
                { label: "Food", value: breakdown.food },
                { label: "Beverages", value: breakdown.beverages },
                { label: "Service", value: breakdown.service },
              ]}
            />
          ) : null}
          <View style={{ marginTop: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                { key: "all", label: "All" },
                { key: "recent", label: "Most recent" },
                { key: "photos", label: "With photos" },
                { key: "5", label: "5★" },
                { key: "4", label: "4★" },
                { key: "3", label: "3★" },
              ].map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  selected={reviewFilter === c.key}
                  onPress={() => {
                    if (c.key === "all" || c.key === "recent") setReviewFilter(c.key);
                    else { haptic.light(); toast.success("Coming soon", "More filters"); }
                  }}
                />
              ))}
            </ScrollView>
          </View>
          <View style={{ marginTop: 16, gap: 12 }}>
            {(reviews ?? []).map((rev) => (
              <ReviewRow key={rev.id} review={rev} />
            ))}
          </View>
        </View>
      ) : null}

      {tab === "facilities" ? (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {(r?.amenities ?? []).map((a) => (
              <View
                key={a}
                style={{
                  width: 90, height: 90, borderRadius: 16,
                  backgroundColor: "#fff", borderWidth: 1, borderColor: surface.hairline,
                  alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Icon name={amenityIcon(a)} size={22} color="#FC8019" />
                <Text numberOfLines={2} style={{ fontSize: 11, color: surface.ink, textAlign: "center", paddingHorizontal: 4, fontWeight: "500" }}>
                  {a}
                </Text>
              </View>
            ))}
            {(r?.amenities ?? []).length === 0 ? (
              <Text style={{ fontSize: 13, color: surface.ink3 }}>No amenities listed.</Text>
            ) : null}
          </View>

          {similar && similar.length > 0 ? (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: surface.ink, marginBottom: 4 }}>Similar restaurants</Text>
              <View style={{ height: 1, backgroundColor: surface.hairline, marginVertical: 8 }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, gap: 12 }}>
                {similar.map((s) => (
                  <RestaurantCard key={s.id} restaurant={s} variant="compact" />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push({ pathname: "/menu/[id]", params: { id: r!.id } })}
            style={{
              marginTop: 24, padding: 18, backgroundColor: "#fff", borderRadius: 18,
              borderWidth: 1, borderColor: surface.hairline,
              flexDirection: "row", alignItems: "center", gap: 14,
            }}
          >
            <View
              style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: "#FFF1E0", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="bag.fill" size={18} color="#FC8019" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: surface.ink }}>Looking to get food delivery?</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: surface.ink3 }}>Order anything from the menu</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: brand.orange500 }}>Go to Order Online ›</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  /* ----------------------------- WEB DESKTOP LAYOUT ----------------------------- */
  if (isWeb && isDesktop) {
    return (
      <Screen>
        <View style={{ paddingHorizontal: 24, maxWidth: 1200, width: "100%", alignSelf: "center" }}>
          {/* Above-the-fold split: gallery left, info right */}
          <View style={{ flexDirection: "row", gap: 32, marginTop: 24 }}>
            <View style={{ flex: 58 }}>
              <EditorialGallery
                images={galleryImages}
                onPressImage={(url) => openLightbox(url)}
                onPressViewAll={() => setShowGallerySheet(true)}
              />
            </View>

            <View style={{ flex: 42 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: "700", color: surface.ink, letterSpacing: -0.6 }}>
                    {r?.name}
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 13, color: surface.ink2 }}>
                    {r?.cuisines.join(", ")} · ₹{cost} for two
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 13, color: surface.ink2 }}>
                    {Number(distance).toFixed(0)}km · {r?.address?.split(",")[0] ?? r?.city}, {r?.city ?? "Bangalore"}
                  </Text>
                  <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: open ? "#1E7A3A" : "#DC2626" }} />
                    <Text style={{ fontSize: 13, color: surface.ink2 }}>{open ? "Open" : "Closed"} · {hoursLabel}</Text>
                  </View>
                </View>
                {ratingNum > 0 ? (
                  <View
                    style={{
                      width: 60, height: 64, borderRadius: 12,
                      backgroundColor: "#1E7A3A",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Icon name="star.fill" size={11} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{ratingNum.toFixed(1)}</Text>
                    </View>
                    <Text style={{ marginTop: 1, color: "rgba(255,255,255,0.85)", fontSize: 9, fontWeight: "700" }}>
                      {r?.review_count ?? 0}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ marginTop: 16, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => router.push({ pathname: "/booking/new", params: { restaurantId: r!.id } })}
                  style={{
                    flex: 1, height: 48, borderRadius: 999,
                    borderWidth: 1.5, borderColor: surface.hairlineStrong,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: surface.ink, letterSpacing: -0.1 }}>Book a table</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/scan")}
                  style={{
                    flex: 1, height: 48, borderRadius: 999,
                    backgroundColor: "#0E0D0C",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", letterSpacing: -0.1 }}>Pay bill</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => toast.success("Coming soon", "Cashback details")}
                style={{ marginTop: 14, borderRadius: 16, overflow: "hidden" }}
              >
                <GradientSurface
                  preset="noir"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 14,
                    flexDirection: "row", alignItems: "center", gap: 12,
                    overflow: "hidden",
                  }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute", left: 0, top: 12, bottom: 12, width: 3,
                      backgroundColor: "#FC8019", borderTopRightRadius: 2, borderBottomRightRadius: 2,
                    }}
                  />
                  <View
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: "rgba(252,128,25,0.16)",
                      borderWidth: 1, borderColor: "rgba(252,128,25,0.35)",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="creditcard.fill" size={14} color="#FFB56B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#FFB56B", letterSpacing: 1.6 }}>
                      MEMBER OFFER
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: -0.1 }}>
                      Extra {cashbackPct}% cashback on your dining bill
                    </Text>
                  </View>
                  <Icon name="chevron.right" size={13} color="rgba(255,255,255,0.65)" />
                </GradientSurface>
              </Pressable>

              <View style={{ marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <ActionPill label="What's good here?" leadingNode={<PulsingSparkle size={14} />} onPress={() => toast.success("Coming soon", "AI dining recommendations")} />
                <ActionPill label="Directions" icon="arrow.triangle.turn.up.right.diamond.fill" onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)} />
                <ActionPill label="Call" icon="phone.fill" onPress={() => r?.phone && Linking.openURL(`tel:${r.phone}`)} />
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={{ marginTop: 32 }}>
            <SegmentedTabs
              variant="web"
              tabs={tabs}
              active={tab}
              onChange={(k) => setTab(k as TabKey)}
              scrollable
            />
          </View>

          {tabPanel}

          <WebFooter />
        </View>

        <Modal visible={lightboxIndex >= 0} transparent animationType="fade" onRequestClose={() => setLightboxIndex(-1)}>
          <View style={{ flex: 1, backgroundColor: "rgba(28,28,30,0.92)" }}>
            <FlatList
              ref={lightboxRef}
              horizontal
              pagingEnabled
              data={lightboxPhotos}
              keyExtractor={(_, i) => `lb-${i}`}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={lightboxIndex >= 0 ? lightboxIndex : 0}
              getItemLayout={(_, i) => ({ length: screenWidth, offset: screenWidth * i, index: i })}
              onMomentumScrollEnd={(e) => setLightboxIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
              renderItem={({ item: url }) => (
                <View style={{ width: screenWidth, height: screenHeight, alignItems: "center", justifyContent: "center" }}>
                  <Image source={{ uri: url }} style={{ width: screenWidth, height: screenHeight * 0.75 }} resizeMode="contain" />
                </View>
              )}
            />
            <View style={{ position: "absolute", top: 24, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between" }}>
              <GlassButton icon="xmark" onPress={() => setLightboxIndex(-1)} />
              <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.85)" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: surface.ink }}>
                  {(lightboxIndex >= 0 ? lightboxIndex + 1 : 1)} / {lightboxPhotos.length}
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        <CalcSheet visible={showCalcSheet} onClose={() => setShowCalcSheet(false)} />
        <GallerySheet visible={showGallerySheet} onClose={() => setShowGallerySheet(false)} images={galleryImages} onPick={openLightbox} />
      </Screen>
    );
  }

  /* ----------------------------- MOBILE LAYOUT ----------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Screen statusBarStyle="dark" contentClassName="pb-[180px]">
        <View style={{ paddingTop: insets.top }}>
          <EditorialGallery
            images={galleryImages}
            onPressImage={(url) => openLightbox(url)}
            onPressViewAll={() => setShowGallerySheet(true)}
          />
        </View>

        <View
          style={{
            position: "absolute", top: insets.top + 8, left: 0, right: 0,
            paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          <GlassButton icon="chevron.left" onPress={() => router.back()} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GlassButton icon="bookmark" onPress={() => toast.success("Saved", `${r?.name} added to favourites.`)} />
            <GlassButton icon="square.and.arrow.up" onPress={() => toast.success("Coming soon", "Sharing")} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <View style={{ flex: 1 }}>
              {r?.featured ? (
                <Text style={{ fontSize: 10, fontWeight: "800", color: brand.orange500, letterSpacing: 1.8 }}>
                  EDITOR'S PICK
                </Text>
              ) : null}
              <Text
                style={{
                  marginTop: r?.featured ? 6 : 0,
                  fontSize: 30,
                  fontWeight: "800",
                  color: surface.ink,
                  letterSpacing: -1,
                  lineHeight: 34,
                }}
              >
                {r?.name}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 13, color: surface.ink2, lineHeight: 18 }}>
                {(r?.cuisines ?? []).slice(0, 3).join(" · ")}
              </Text>
            </View>
            {ratingNum > 0 ? (
              <View
                style={{
                  alignItems: "flex-end",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="star.fill" size={14} color="#1E7A3A" />
                  <Text style={{ color: surface.ink, fontSize: 18, fontWeight: "800", letterSpacing: -0.4 }}>
                    {ratingNum.toFixed(1)}
                  </Text>
                </View>
                <Text style={{ marginTop: 2, fontSize: 11, color: surface.ink3, fontWeight: "500" }}>
                  {r?.review_count ?? 0} reviews
                </Text>
              </View>
            ) : null}
          </View>

          {/* Single elegant info line */}
          <Text style={{ marginTop: 14, fontSize: 13, color: surface.ink2, fontWeight: "500", letterSpacing: -0.1 }}>
            <Text style={{ color: surface.ink, fontWeight: "700" }}>₹{cost.toLocaleString("en-IN")}</Text> for two
            <Text style={{ color: surface.ink3 }}>  ·  </Text>
            <Text style={{ color: surface.ink, fontWeight: "700" }}>{Number(distance).toFixed(1)} km</Text> away
            <Text style={{ color: surface.ink3 }}>  ·  </Text>
            <Text style={{ color: open ? "#1E5E2F" : "#9C2E3D", fontWeight: "700" }}>
              {open ? `Open until ${hoursLabel.split(" to ")[1] ?? hoursLabel}` : "Closed"}
            </Text>
          </Text>

          {/* Hairline + address line */}
          <View style={{ marginTop: 16, height: 1, backgroundColor: surface.hairline }} />
          <Pressable
            onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)}
            style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Icon name="mappin" size={13} color={surface.ink3} />
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: surface.ink2, fontWeight: "500" }}>
              {r?.address?.split(",")[0] ?? r?.city}, {r?.city ?? "Bangalore"}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: brand.orange500 }}>Directions →</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}
        >
          <ActionPill label="What's good here?" leadingNode={<PulsingSparkle size={14} />} onPress={() => toast.success("Coming soon", "AI dining recommendations")} />
          <ActionPill label="Directions" icon="arrow.triangle.turn.up.right.diamond.fill" onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)} />
          <ActionPill label="Call" icon="phone.fill" onPress={() => r?.phone && Linking.openURL(`tel:${r.phone}`)} />
        </ScrollView>

        <View style={{ marginTop: 20 }}>
          <SegmentedTabs tabs={tabs} active={tab} onChange={(k) => setTab(k as TabKey)} scrollable />
        </View>

        {tabPanel}

        <View style={{ height: 40 }} />
      </Screen>

      <StickyPayBar
        cashbackPct={cashbackPct}
        onCashbackPress={() => toast.success("Coming soon", "Cashback details")}
        onBookPress={() => router.push({ pathname: "/booking/new", params: { restaurantId: r!.id } })}
        onPayPress={() => router.push("/scan")}
      />

      <Modal visible={lightboxIndex >= 0} transparent animationType="fade" onRequestClose={() => setLightboxIndex(-1)}>
        <View style={{ flex: 1, backgroundColor: "rgba(28,28,30,0.95)" }}>
          <FlatList
            ref={lightboxRef}
            horizontal
            pagingEnabled
            data={lightboxPhotos}
            keyExtractor={(_, i) => `lb-${i}`}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIndex >= 0 ? lightboxIndex : 0}
            getItemLayout={(_, i) => ({ length: screenWidth, offset: screenWidth * i, index: i })}
            onMomentumScrollEnd={(e) => setLightboxIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
            renderItem={({ item: url }) => (
              <View style={{ width: screenWidth, height: screenHeight, alignItems: "center", justifyContent: "center" }}>
                <Image source={{ uri: url }} style={{ width: screenWidth, height: screenHeight * 0.7 }} resizeMode="contain" />
              </View>
            )}
          />
          <View style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" }}>
            <GlassButton icon="xmark" onPress={() => setLightboxIndex(-1)} />
            <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.85)" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: surface.ink }}>
                {(lightboxIndex >= 0 ? lightboxIndex + 1 : 1)} / {lightboxPhotos.length}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <CalcSheet visible={showCalcSheet} onClose={() => setShowCalcSheet(false)} />
      <GallerySheet visible={showGallerySheet} onClose={() => setShowGallerySheet(false)} images={galleryImages} onPick={openLightbox} />
    </View>
  );
}

function ActionPill({
  label,
  icon,
  leadingNode,
  onPress,
}: {
  label: string;
  icon?: string;
  leadingNode?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 14, paddingVertical: 11, borderRadius: 999,
        backgroundColor: "#fff", borderWidth: 1, borderColor: surface.hairlineStrong,
      }}
    >
      {leadingNode ?? (icon ? <Icon name={icon} size={14} color={surface.ink} /> : null)}
      <Text style={{ fontSize: 13, fontWeight: "700", color: surface.ink, letterSpacing: -0.1 }}>{label}</Text>
    </Pressable>
  );
}

function CalcSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Sheet.Body>
        <Text style={{ fontSize: 18, fontWeight: "700", color: surface.ink, letterSpacing: -0.4 }}>Calculate savings</Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: surface.ink3 }}>
          Live savings calculator is coming soon.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Close" variant="secondary" onPress={onClose} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

function GallerySheet({
  visible, onClose, images, onPick,
}: {
  visible: boolean; onClose: () => void; images: string[]; onPick: (url: string) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Sheet.Body>
        <Text style={{ fontSize: 18, fontWeight: "700", color: surface.ink, letterSpacing: -0.4 }}>Gallery</Text>
        <Text style={{ marginTop: 6, fontSize: 13, color: surface.ink3 }}>
          Tap any image to expand.
        </Text>
        <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {images.map((url, i) => (
            <Pressable
              key={i}
              onPress={() => { onClose(); onPick(url); }}
              style={{ width: "31%" }}
            >
              <Image source={{ uri: url }} style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }} />
            </Pressable>
          ))}
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

function OffersTab({
  offers, estimatedBill, youPay, saveUpTo, cashback,
  onBookFromOffer, onCalculatePress,
}: {
  offers: { id: string; title: string; promo_code: string | null; min_order_amount: number }[];
  estimatedBill: number; youPay: number; saveUpTo: number; cashback: number;
  onBookFromOffer: (offerId: string) => void; onCalculatePress: () => void;
}) {
  const toast = useToast();
  const heroOffer = offers[0];
  const addOnOffers = offers.slice(1);
  const heroTitle = heroOffer ? heroOffer.title.toUpperCase() : "FLAT 15% OFF";

  return (
    <View style={{ paddingHorizontal: 20, gap: 32 }}>
      {/* Hero offer */}
      <View>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: surface.ink3, letterSpacing: 1.6 }}>
            OFFERS FOR TONIGHT
          </Text>
          <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: surface.ink, letterSpacing: -0.6 }}>
              Reserve a table for
            </Text>
            <Pressable onPress={() => { haptic.light(); toast.success("Coming soon", "Slot switcher"); }} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <DottedUnderline textStyle={{ fontSize: 22, fontWeight: "800", color: surface.ink, letterSpacing: -0.6 }}>
                dinner
              </DottedUnderline>
              <Icon name="chevron.down" size={11} color={surface.ink3} />
            </Pressable>
          </View>
        </View>

        <OfferCoupon
          title={heroTitle.length > 16 ? "Flat 15% off" : heroTitle}
          subtitle="A complimentary mocktail per guest"
          slotInfo="From 7:45 PM"
          slotMeta="19 slots remaining · ₹25 cover"
          onBookPress={() => onBookFromOffer(heroOffer?.id ?? "")}
        />
        {offers.length > 1 ? (
          <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center", gap: 5 }}>
            <View style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: surface.ink }} />
            <View style={{ width: 5, height: 3, borderRadius: 2, backgroundColor: surface.ink4 }} />
            <View style={{ width: 5, height: 3, borderRadius: 2, backgroundColor: surface.ink4 }} />
          </View>
        ) : null}
      </View>

      {/* Inclusions list — clean, restrained, no icon-tile noise */}
      <View>
        <Text style={{ fontSize: 11, fontWeight: "800", color: surface.ink3, letterSpacing: 1.6 }}>
          ALSO INCLUDED
        </Text>
        <View
          style={{
            marginTop: 12,
            borderRadius: 18,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: surface.hairline,
            overflow: "hidden",
          }}
        >
          {(addOnOffers.length > 0 ? addOnOffers : DEFAULT_ADDONS).map((o, i, arr) => {
            const isReal = "title" in o && "promo_code" in o;
            const label = isReal ? (o.promo_code ?? "Offer") : (o as typeof DEFAULT_ADDONS[number]).label;
            const value = isReal ? o.title : (o as typeof DEFAULT_ADDONS[number]).value;
            return (
              <View
                key={isReal ? o.id : `def-${i}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: surface.hairline,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: surface.ink2, letterSpacing: -0.1 }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: surface.ink, letterSpacing: -0.1 }}>
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Sample bill */}
      <View>
        <Text style={{ fontSize: 11, fontWeight: "800", color: surface.ink3, letterSpacing: 1.6 }}>
          SAMPLE BILL
        </Text>
        <Text style={{ marginTop: 4, fontSize: 22, fontWeight: "800", color: surface.ink, letterSpacing: -0.6 }}>
          What you'll save
        </Text>
        <View style={{ marginTop: 14 }}>
          <SampleBill
            estimatedBill={estimatedBill} youPay={youPay} saveUpTo={saveUpTo} cashback={cashback}
            onCalculatePress={onCalculatePress}
          />
        </View>
      </View>
    </View>
  );
}

const DEFAULT_ADDONS = [
  { icon: "gift.fill", label: "Welcome offer", value: "Flat ₹250 off" },
  { icon: "creditcard.fill", label: "Bank discount", value: "25% off" },
  { icon: "bolt.fill", label: "Cashback", value: "Up to ₹500" },
] as const;
