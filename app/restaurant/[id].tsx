import { useMemo, useState } from "react";
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Screen, haptic } from "@/components/ui";
import { useToast } from "@/store/toast";
import {
  useRestaurant, useMenu, useReviews, useReviewBreakdown, useSimilarRestaurants,
  type DineoutRestaurant,
} from "@/hooks/queries";
import { T } from "@/lib/visual";
import { rupees, timeAgo } from "@/lib/format";
import {
  Img, Pill, StarChip, Chip, VegDot, DimeBtn, CtaStrip, display, mono, num,
} from "@/components/dime/atoms";
import { MapEmbed } from "@/components/restaurant/MapEmbed";
import { useEnsureCustomerThread } from "@/hooks/chat";
import { useAuth } from "@/store/auth";
import type { Tables } from "@/lib/supabase";

type TabKey = "offers" | "menu" | "ask" | "reviews" | "facilities";

const FACILITIES_ICONS: Record<string, string> = {
  "wi-fi": "wifi", wifi: "wifi", "free wifi": "wifi",
  valet: "car.fill", "valet parking": "car.fill",
  "outdoor seating": "leaf.fill",
  "family-friendly": "person.2.fill",
  "live music": "music.note",
  "pet-friendly": "pawprint.fill",
  ac: "snowflake", "air-conditioned": "snowflake", "air conditioning": "snowflake",
  bar: "wineglass.fill", "wine bar": "wineglass.fill", "full bar": "wineglass.fill",
  rooftop: "building.2.fill",
  cards: "creditcard.fill", "card payments": "creditcard.fill",
};

function facilityIcon(label: string): string {
  return FACILITIES_ICONS[label.toLowerCase()] ?? "checkmark.seal.fill";
}

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const profile = useAuth((s) => s.profile);
  const ensureThread = useEnsureCustomerThread();

  const { data: rRaw, isLoading } = useRestaurant(id);
  const r = rRaw as DineoutRestaurant | null | undefined;
  const { data: menu } = useMenu(id);
  const { data: reviews } = useReviews(id);
  const { data: breakdown } = useReviewBreakdown(id);
  const { data: similar } = useSimilarRestaurants(id);

  const startChat = async () => {
    if (!profile?.id || !r) {
      toast.error("Sign in", "Please sign in to chat with the restaurant.");
      return;
    }
    try {
      const thread = await ensureThread.mutateAsync({ restaurantId: r.id, customerId: profile.id });
      router.push({ pathname: "/chat/[id]", params: { id: thread.id } });
    } catch (e) {
      toast.error("Could not start chat", (e as Error).message);
    }
  };

  const [tab, setTab] = useState<TabKey>("offers");

  const cost = r?.cost_for_two ?? 1200;
  const distance = r?.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : "—";
  const cashbackPct = r?.cashback_pct ?? 25;

  const hoursLabel = useMemo(() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined> | undefined)?.[day];
    if (!h) return "11:30 PM";
    const [hh, mm] = h.close.split(":").map(Number);
    const hour12 = ((hh ?? 0) % 12) || 12;
    const ampm = (hh ?? 0) >= 12 ? "PM" : "AM";
    return `${hour12}:${String(mm ?? 0).padStart(2, "0")} ${ampm}`;
  }, [r]);

  if (!r && !isLoading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <Screen scroll={false} statusBarStyle="dark" className="bg-[#F6F2EC]">
        <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
          {/* Hero image */}
          <View style={{ position: "relative" }}>
            <Img uri={r?.cover_image_url} kind="restaurant" h={290} w={"100%" as unknown as number} radius={0} hue={28} />
            <Pressable
              onPress={() => router.back()}
              style={{
                position: "absolute", top: insets.top + 12, left: 16,
                width: 38, height: 38, borderRadius: 999,
                backgroundColor: T.card,
                alignItems: "center", justifyContent: "center",
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
              }}
            >
              <Icon name="chevron.left" size={20} color={T.ink} />
            </Pressable>
            <View style={{ position: "absolute", top: insets.top + 12, right: 16, flexDirection: "row", gap: 8 }}>
              {[
                { icon: "heart", action: () => toast.success("Saved", `${r?.name} added to favourites.`) },
                { icon: "square.and.arrow.up", action: () => toast.success("Coming soon", "Sharing") },
              ].map((b) => (
                <Pressable
                  key={b.icon}
                  onPress={b.action}
                  style={{
                    width: 38, height: 38, borderRadius: 999,
                    backgroundColor: T.card,
                    alignItems: "center", justifyContent: "center",
                    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
                  }}
                >
                  <Icon name={b.icon} size={18} color={T.ink} />
                </Pressable>
              ))}
            </View>
            <View
              style={{
                position: "absolute", bottom: 14, right: 16,
                backgroundColor: T.ink, borderRadius: 999,
                paddingHorizontal: 12, paddingVertical: 6,
                flexDirection: "row", alignItems: "center", gap: 4,
              }}
            >
              <Icon name="photo.fill" size={12} color={T.cream} />
              <Text style={{ color: T.cream, fontSize: 11, fontWeight: "600" }}>
                View gallery · {r?.gallery_urls?.length ?? r?.gallery_images?.length ?? 0}
              </Text>
            </View>
          </View>

          {/* Identity */}
          <View
            style={{
              backgroundColor: T.card, paddingHorizontal: 18, paddingVertical: 16,
              borderBottomWidth: 1, borderBottomColor: T.hairline,
            }}
          >
            {r?.featured ? (
              <Text style={[mono(10, "700", 1.4), { color: T.saffron }]}>EDITOR'S PICK</Text>
            ) : null}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 2, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[display(28, "600", -0.6), { lineHeight: 30 }]}>{r?.name}</Text>
                <Text style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                  {r?.cuisines.slice(0, 4).join(" · ")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StarChip score={Number(r?.rating ?? 0).toFixed(1)} />
                <Text style={[num(11, "500"), { color: T.muted, marginTop: 4 }]}>
                  {r?.review_count ?? 0}+ reviews
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              <Text style={num(12.5, "500")}>₹{cost.toLocaleString("en-IN")} for two</Text>
              <Text style={{ color: T.hairline, fontSize: 9 }}>•</Text>
              <Text style={num(12.5, "500")}>{distance}</Text>
              <Text style={{ color: T.hairline, fontSize: 9 }}>•</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.forest }} />
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: T.forest }}>
                  Open until {hoursLabel}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)}
              style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon name="mappin" size={13} color={T.muted} />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: T.muted }}>
                {r?.address ?? `${r?.city}`}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: T.saffron }}>Directions</Text>
                <Icon name="arrow.right" size={12} color={T.saffron} />
              </View>
            </Pressable>

            {/* Quick actions */}
            {/* Row 1 — AI tip + Phone */}
            <View style={{ marginTop: 14, flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => { haptic.light(); toast.success("Coming soon", "AI dining recs"); }}
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  backgroundColor: T.cream,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Icon name="sparkles" size={14} color={T.saffron} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: T.ink, letterSpacing: -0.1 }}>What's good here?</Text>
              </Pressable>
              <Pressable
                onPress={() => r?.phone && Linking.openURL(`tel:${r.phone}`)}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: T.cream,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="phone.fill" size={16} color={T.ink} />
              </Pressable>
            </View>

            {/* Row 2 — Directions + Chat with restaurant (the new prominent CTAs) */}
            <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)}
                style={{
                  flex: 1, height: 48, borderRadius: 12,
                  backgroundColor: T.ink,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Icon name="location.north.fill" size={15} color={T.cream} />
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: T.cream, letterSpacing: -0.1 }}>Directions</Text>
              </Pressable>
              <Pressable
                onPress={startChat}
                disabled={ensureThread.isPending}
                style={{
                  flex: 1, height: 48, borderRadius: 12,
                  backgroundColor: T.saffron,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: ensureThread.isPending ? 0.7 : 1,
                  shadowColor: T.saffron,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.22,
                  shadowRadius: 14,
                  elevation: 4,
                }}
              >
                <Icon name="text.bubble.fill" size={15} color="#fff" />
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: "#fff", letterSpacing: -0.1 }}>
                  {ensureThread.isPending ? "Opening…" : "Chat with restaurant"}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                    backgroundColor: "rgba(255,255,255,0.22)",
                    marginLeft: 2,
                    flexDirection: "row", alignItems: "center", gap: 4,
                  }}
                >
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#fff" }} />
                  <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.6, fontFamily: T.fontMono }}>
                    LIVE
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Map embed — visible if owner has set coordinates */}
            {r?.latitude != null && r?.longitude != null ? (
              <View style={{ marginTop: 16 }}>
                <MapEmbed lat={Number(r.latitude)} lng={Number(r.longitude)} address={r.address} height={170} />
              </View>
            ) : null}
          </View>

          {/* Tabs */}
          <View
            style={{
              backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.hairline,
            }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { id: "offers" as TabKey, label: "Offers" },
                { id: "menu" as TabKey, label: "Menu" },
                { id: "ask" as TabKey, label: "Ask anything", badge: "New" },
                { id: "reviews" as TabKey, label: "Reviews" },
                { id: "facilities" as TabKey, label: "Facilities" },
              ].map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { haptic.select(); setTab(t.id); }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 14,
                    flexDirection: "row", alignItems: "center", gap: 6,
                    borderBottomWidth: 2,
                    borderBottomColor: tab === t.id ? T.ink : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: tab === t.id ? T.ink : T.muted }}>
                    {t.label}
                  </Text>
                  {t.badge ? (
                    <View
                      style={{
                        backgroundColor: T.saffron,
                        paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 }}>
                        {t.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Tab content */}
          <View style={{ paddingVertical: 18 }}>
            {tab === "offers" ? <OffersTab cost={cost} cashbackPct={cashbackPct} /> : null}
            {tab === "menu" ? <MenuTab items={menu?.items ?? []} categories={menu?.categories ?? []} /> : null}
            {tab === "ask" ? <AskTab restaurantName={r?.name ?? ""} /> : null}
            {tab === "reviews" ? (
              <ReviewsTab
                breakdown={breakdown}
                reviews={reviews ?? []}
                restaurantId={r?.id ?? ""}
                onWrite={() => r && router.push({ pathname: "/review/write", params: { id: r.id } })}
              />
            ) : null}
            {tab === "facilities" ? <FacilitiesTab amenities={r?.amenities ?? []} similar={similar ?? []} onPick={(rid) => router.push({ pathname: "/restaurant/[id]", params: { id: rid } })} /> : null}
          </View>
        </ScrollView>
      </Screen>

      {/* CTA strip */}
      <CtaStrip
        note={`Member offer · Extra ${cashbackPct}% cashback on your dining bill`}
        bottomInset={Math.max(insets.bottom, 12) + 14}
      >
        <DimeBtn
          label="Book a table"
          variant="ghost"
          full
          onPress={() => r && router.push({ pathname: "/booking/new", params: { restaurantId: r.id } })}
        />
        <DimeBtn
          label="Pay bill"
          variant="dark"
          full
          leading={<Icon name="qrcode.viewfinder" size={16} color={T.cream} />}
          onPress={() => router.push("/scan")}
        />
      </CtaStrip>
    </View>
  );
}

/* ───────── Offers tab ───────── */

function OffersTab({ cost, cashbackPct }: { cost: number; cashbackPct: number }) {
  const youPay = Math.round(cost * 0.65);
  const saveInstant = Math.round(cost * 0.35);
  const cashback = Math.round(cost * (cashbackPct / 100) * 0.65);
  const totalSaving = saveInstant + cashback;
  const savePct = cost > 0 ? Math.round((totalSaving / cost) * 100) : 0;

  return (
    <View style={{ paddingHorizontal: 18, gap: 14 }}>
      {/* Live event */}
      <View
        style={{
          backgroundColor: T.ink, borderRadius: 18, padding: 16, position: "relative",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              backgroundColor: T.ruby,
              paddingHorizontal: 7, paddingVertical: 3,
              borderRadius: 4,
              flexDirection: "row", alignItems: "center", gap: 4,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }} />
            <Text style={[mono(9.5, "700", 1.2), { color: "#fff" }]}>LIVE</Text>
          </View>
          <Text style={[mono(11, "600", 0.5), { color: T.amber }]}>TONIGHT · FROM 7:45 PM</Text>
        </View>
        <Text style={[display(22, "600", -0.4), { color: T.cream, marginTop: 8 }]}>Pizza Party</Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          A complimentary mocktail per guest. House DJ from 9 PM.
        </Text>
        <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={[mono(11, "700", 1), { color: "rgba(255,255,255,0.5)" }]}>SLOTS</Text>
            <Text style={[num(14, "700"), { color: "#fff" }]}>19 of 40 · ₹25 cover</Text>
          </View>
          <DimeBtn
            label="Book now"
            variant="primary"
            size="sm"
            style={{ paddingHorizontal: 16, height: 40 }}
          />
        </View>
      </View>

      {/* Member offer ribbon */}
      <View
        style={{
          backgroundColor: T.saffron, borderRadius: 16, padding: 16,
          flexDirection: "row", alignItems: "center", gap: 12,
        }}
      >
        <View
          style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.18)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="sparkles" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[mono(10, "700", 1.4), { color: "rgba(255,255,255,0.9)" }]}>MEMBER OFFER</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
            Extra {cashbackPct}% cashback on your dining bill
          </Text>
        </View>
      </View>

      {/* Also included */}
      <View
        style={{
          backgroundColor: T.card, borderRadius: 16, padding: 14,
          borderWidth: 1, borderColor: T.hairline,
        }}
      >
        <Text style={[mono(10.5, "700", 1.2), { marginBottom: 10 }]}>ALSO INCLUDED</Text>
        {[
          { label: "Welcome offer", val: "Flat ₹250 off" },
          { label: "Bank discount", val: "25% off · select cards" },
          { label: "Cashback", val: `Up to ₹${Math.round(cost * 0.4)}` },
        ].map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: "row", alignItems: "center", gap: 10,
              paddingVertical: 10,
              borderTopWidth: i ? 1 : 0, borderTopColor: T.hairline,
            }}
          >
            <View
              style={{
                width: 30, height: 30, borderRadius: 8,
                backgroundColor: T.cream,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="tag.fill" size={14} color={T.saffron} />
            </View>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", color: T.ink }}>{row.label}</Text>
            <Text style={[num(13, "700"), { color: T.ink }]}>{row.val}</Text>
          </View>
        ))}
      </View>

      {/* Sample bill */}
      <View style={{ backgroundColor: T.cream, borderRadius: 18, padding: 16 }}>
        <Text style={[mono(10.5, "700", 1.2)]}>SAMPLE BILL</Text>
        <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={display(18, "600", -0.3)}>What you'll save</Text>
          <Pill bg={T.saffron} color="#fff" size={11}>SAVE {savePct}%</Pill>
        </View>
        <View style={{ marginTop: 14, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Text style={[num(28, "700"), { color: T.ink }]}>₹{youPay.toLocaleString("en-IN")}</Text>
          <Text
            style={[
              num(16, "500"),
              { color: T.muted, textDecorationLine: "line-through" },
            ]}
          >
            ₹{cost.toLocaleString("en-IN")}
          </Text>
        </View>
        <Text style={{ marginTop: 6, fontSize: 12, color: T.ink2 }}>
          For 2 guests ·{" "}
          <Text style={num(12, "600")}>₹{saveInstant.toLocaleString("en-IN")} instant</Text>
          {" + "}
          <Text style={num(12, "600")}>₹{cashback.toLocaleString("en-IN")} cashback</Text>
        </Text>
        <Pressable style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: T.saffron }}>Calculate savings on any bill</Text>
          <Icon name="arrow.right" size={13} color={T.saffron} />
        </Pressable>
      </View>
    </View>
  );
}

/* ───────── Menu tab ───────── */

function MenuTab({
  items,
  categories,
}: {
  items: Tables<"menu_items">[];
  categories: Tables<"menu_categories">[];
}) {
  const groups = categories
    .map((c) => ({ category: c, items: items.filter((i) => i.category_id === c.id && i.is_available) }))
    .filter((g) => g.items.length > 0);

  return (
    <View style={{ paddingHorizontal: 18 }}>
      <View
        style={{
          height: 44, borderRadius: 12,
          backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
          flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8,
          marginBottom: 14,
        }}
      >
        <Icon name="magnifyingglass" size={16} color={T.muted} />
        <Text style={{ fontSize: 13, color: T.muted }}>Search the menu</Text>
      </View>

      {groups.length === 0 ? (
        <Text style={{ paddingVertical: 24, textAlign: "center", color: T.muted, fontSize: 13 }}>No menu items yet.</Text>
      ) : null}

      {groups.map((g) => (
        <View key={g.category.id} style={{ marginBottom: 22 }}>
          <Text style={[mono(11, "700", 1.4), { marginBottom: 10 }]}>
            {g.category.name.toUpperCase()} ({g.items.length})
          </Text>
          <View style={{ gap: 14 }}>
            {g.items.map((it) => (
              <View key={it.id} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <VegDot veg={it.is_veg} />
                    {it.is_bestseller ? (
                      <Text style={[mono(9.5, "700", 1.2), { color: T.amber }]}>● BESTSELLER</Text>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "600", letterSpacing: -0.2, marginTop: 6, color: T.ink }}>
                    {it.name}
                  </Text>
                  <Text style={[num(14, "700"), { marginTop: 2, color: T.ink }]}>
                    ₹{Math.round(Number(it.price))}
                  </Text>
                  {it.description ? (
                    <Text style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 17 }} numberOfLines={2}>
                      {it.description}
                    </Text>
                  ) : null}
                </View>
                <Img uri={it.images[0]} kind="dish" h={94} w={94} radius={12} hue={28} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ───────── Ask anything tab ───────── */

function AskTab({ restaurantName }: { restaurantName: string }) {
  const [value, setValue] = useState("");
  const toast = useToast();
  const submit = () => {
    if (value.trim().length < 3) return;
    haptic.success();
    toast.success("Coming soon", "We'll soon answer your dining questions with AI.");
    setValue("");
  };
  return (
    <View style={{ paddingHorizontal: 18 }}>
      <View
        style={{
          backgroundColor: "#FFF1E6", borderRadius: 18, padding: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="sparkles" size={18} color={T.saffron} />
          <Text style={[mono(11, "700", 1), { color: T.saffron, textTransform: "uppercase" }]}>
            POWERED BY DIME AI
          </Text>
        </View>
        <Text style={[display(22, "600", -0.4), { marginTop: 8 }]}>
          Ask anything about {restaurantName}
        </Text>
        <View
          style={{
            marginTop: 14, backgroundColor: T.card, borderRadius: 14,
            borderWidth: 1, borderColor: T.hairline,
            paddingLeft: 14, paddingRight: 4, paddingVertical: 4,
            flexDirection: "row", alignItems: "center", gap: 8,
          }}
        >
          <TextInput
            placeholder="What would you like to know?"
            placeholderTextColor={T.muted}
            value={value}
            onChangeText={setValue}
            style={{
              flex: 1, height: 42, fontSize: 14, color: T.ink,
            }}
          />
          <Pressable
            onPress={submit}
            style={{
              width: 38, height: 38, borderRadius: 10,
              backgroundColor: T.saffron,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="paperplane.fill" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
      <View style={{ marginTop: 14, gap: 8 }}>
        {[
          "Curate a date-night meal plan",
          "Must-have desserts",
          "Light, healthy meals for dinner",
          "Any special drinks?",
        ].map((s) => (
          <Pressable
            key={s}
            onPress={() => { haptic.select(); setValue(s); }}
            style={{
              backgroundColor: T.card, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
              borderWidth: 1, borderColor: T.hairline,
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 13.5, color: T.ink }}>{s}</Text>
            <Icon name="arrow.right" size={14} color={T.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ───────── Reviews tab ───────── */

function ReviewsTab({
  breakdown,
  reviews,
  restaurantId,
  onWrite,
}: {
  breakdown: { food: number; beverages: number; service: number; overall: number; total: number } | undefined;
  reviews: (Tables<"reviews"> & { users: { name: string | null; avatar_url: string | null } })[];
  restaurantId: string;
  onWrite: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 18 }}>
      <Pressable
        onPress={onWrite}
        style={{
          flexDirection: "row", alignItems: "center", gap: 12,
          padding: 14, borderRadius: 16, marginBottom: 14,
          backgroundColor: T.ink,
        }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: "rgba(255,90,31,0.18)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="star.fill" size={16} color={T.saffron} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: T.cream, letterSpacing: -0.2 }}>
            Write a review
          </Text>
          <Text style={{ marginTop: 1, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
            Share your experience · 5-star rating + per-axis breakdown
          </Text>
        </View>
        <Icon name="arrow.right" size={14} color={T.cream} />
      </Pressable>

      {breakdown ? (
        <View
          style={{
            backgroundColor: T.card, borderRadius: 18, padding: 16,
            borderWidth: 1, borderColor: T.hairline,
            flexDirection: "row", alignItems: "center", gap: 16,
          }}
        >
          <View
            style={{
              backgroundColor: T.forest, borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 10,
              alignItems: "center", minWidth: 76,
            }}
          >
            <Text style={[num(28, "700"), { color: "#fff", lineHeight: 30 }]}>
              {(breakdown.overall || 0).toFixed(1)}
            </Text>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600", letterSpacing: 0.6, marginTop: 2 }}>
              {breakdown.total} RATINGS
            </Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            {[
              { k: "Food", v: breakdown.food },
              { k: "Beverages", v: breakdown.beverages },
              { k: "Service", v: breakdown.service },
            ].map((s) => (
              <View key={s.k} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 12, color: T.muted, width: 76 }}>{s.k}</Text>
                <View style={{ flex: 1, height: 6, backgroundColor: T.hairline, borderRadius: 3 }}>
                  <View style={{ width: `${Math.min(100, (s.v / 5) * 100)}%`, height: "100%", backgroundColor: T.forest, borderRadius: 3 }} />
                </View>
                <Text style={[num(12, "700"), { width: 28, textAlign: "right" }]}>{s.v.toFixed(1)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 14 }}
      >
        {["All", "Most recent", "With photos", "5★", "4★", "3★"].map((c, i) => (
          <Chip key={c} active={i === 0}>{c}</Chip>
        ))}
      </ScrollView>

      <View style={{ gap: 12 }}>
        {reviews.slice(0, 10).map((rev) => (
          <View
            key={rev.id}
            style={{
              backgroundColor: T.card, borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: T.hairline,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 36, height: 36, borderRadius: 999,
                  backgroundColor: T.cream,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 12, color: T.ink }}>
                  {(rev.users?.name ?? "Diner").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: T.ink }}>{rev.users?.name ?? "Diner"}</Text>
                <Text style={{ fontSize: 11, color: T.muted }}>{timeAgo(rev.created_at)}</Text>
              </View>
              <StarChip score={Number(rev.overall_rating).toFixed(1)} size="sm" />
            </View>
            {rev.text ? (
              <Text style={{ fontSize: 13, color: T.ink2, marginTop: 10, lineHeight: 19 }}>{rev.text}</Text>
            ) : null}
          </View>
        ))}
        {reviews.length === 0 ? (
          <Text style={{ paddingVertical: 24, textAlign: "center", color: T.muted, fontSize: 13 }}>
            No reviews yet.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ───────── Facilities tab ───────── */

function FacilitiesTab({
  amenities,
  similar,
  onPick,
}: {
  amenities: string[];
  similar: Tables<"restaurants">[];
  onPick: (id: string) => void;
}) {
  return (
    <View style={{ paddingHorizontal: 18 }}>
      <Text style={[mono(11, "700", 1.4), { marginBottom: 12 }]}>AMENITIES</Text>
      {amenities.length === 0 ? (
        <Text style={{ fontSize: 13, color: T.muted }}>No amenities listed.</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {amenities.map((a) => (
            <View
              key={a}
              style={{
                width: "48%",
                backgroundColor: T.card, borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: T.hairline,
                flexDirection: "row", alignItems: "center", gap: 10,
              }}
            >
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: T.cream,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name={facilityIcon(a)} size={18} color={T.ink} />
              </View>
              <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "600", color: T.ink, flex: 1 }}>
                {a}
              </Text>
            </View>
          ))}
        </View>
      )}

      {similar.length > 0 ? (
        <>
          <Text style={[mono(11, "700", 1.4), { marginTop: 22, marginBottom: 12 }]}>SIMILAR RESTAURANTS</Text>
          <View style={{ gap: 10 }}>
            {similar.slice(0, 5).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => onPick(r.id)}
                style={{
                  backgroundColor: T.card, borderRadius: 14, padding: 10,
                  borderWidth: 1, borderColor: T.hairline,
                  flexDirection: "row", alignItems: "center", gap: 12,
                }}
              >
                <Img uri={r.cover_image_url} kind="restaurant" h={56} w={56} radius={10} hue={28} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: T.ink }}>{r.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                    {r.cuisines.slice(0, 3).join(" · ")}
                  </Text>
                </View>
                <StarChip score={Number(r.rating).toFixed(1)} size="sm" />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
