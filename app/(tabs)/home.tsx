import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useRestaurants, useCollections, useMyOrders, useMoodCategories, type DineoutRestaurant } from "@/hooks/queries";
import { useUnreadNotificationCount } from "@/hooks/useNotificationListener";
import { T } from "@/lib/visual";
import { initials } from "@/lib/format";
import {
  Img, Pill, StarChip, SectionHead, DimeBtn, display, mono, num,
} from "@/components/dime/atoms";

const MOOD_PALETTE: Record<string, { hue: number; icon: string }> = {
  date: { hue: 12, icon: "heart.fill" },
  family: { hue: 38, icon: "person.3.fill" },
  quick: { hue: 28, icon: "flame.fill" },
  healthy: { hue: 130, icon: "leaf.fill" },
  business: { hue: 60, icon: "briefcase.fill" },
  late: { hue: 280, icon: "moon.fill" },
  celebrate: { hue: 320, icon: "star.fill" },
  cafe: { hue: 60, icon: "sparkles" },
  street: { hue: 18, icon: "fork.knife" },
  drinks: { hue: 280, icon: "wineglass.fill" },
};

const MOOD_HUE_BG: Record<number, { bg: string; fg: string }> = {
  12: { bg: "#FBE6DE", fg: "#A33C1A" },
  18: { bg: "#FBE2D2", fg: "#9B3712" },
  28: { bg: "#F8E2C5", fg: "#8B5A18" },
  38: { bg: "#F4E5C2", fg: "#7B5C1A" },
  60: { bg: "#EFEDC8", fg: "#5C5915" },
  130: { bg: "#D8E9CB", fg: "#2F6A2A" },
  200: { bg: "#CFE0E8", fg: "#1F4F66" },
  280: { bg: "#E0D7EC", fg: "#4B3E80" },
  320: { bg: "#EBD5DF", fg: "#7A2C50" },
};

function moodColors(hue: number) {
  return MOOD_HUE_BG[hue] ?? { bg: T.cream, fg: T.ink };
}

export default function Home() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const { data: featured } = useRestaurants({ featured: true });
  const { data: allRestaurants } = useRestaurants();
  const { data: collections } = useCollections();
  const { data: orders } = useMyOrders();
  const { data: moods } = useMoodCategories();
  const unread = useUnreadNotificationCount();

  const activeOrder = useMemo(() => orders?.find((o) => o.status !== "paid" && o.status !== "cancelled"), [orders]);
  const lastOrder = useMemo(() => orders?.find((o) => o.status === "paid"), [orders]);

  const tonightPick = (featured?.[0] ?? allRestaurants?.[0]) as DineoutRestaurant | undefined;
  const popular = (allRestaurants ?? []).filter((r) => r.id !== tonightPick?.id).slice(0, 4) as DineoutRestaurant[];
  const editorPicks = (featured ?? []).filter((r) => r.id !== tonightPick?.id).slice(0, 6) as DineoutRestaurant[];

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const today = new Date();
  const formatDate = `${today.toLocaleString("en-US", { month: "short" })} · ${today.getDate().toString().padStart(2, "0")}`;

  return (
    <Screen className="bg-[#F6F2EC]" contentClassName="">
      <View style={{ backgroundColor: T.bg, paddingBottom: 96 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => { haptic.light(); router.push("/discover"); }}
            style={{ flex: 1 }}
          >
            <Text style={mono(10, "700", 1.3)}>DELIVER TO</Text>
            <View style={{ marginTop: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="mappin" size={16} color={T.ink} />
              <View style={{ borderBottomWidth: 1.5, borderBottomColor: T.ink }}>
                <Text style={{ fontSize: 16, fontWeight: "700", letterSpacing: -0.2, color: T.ink }}>Bangalore</Text>
              </View>
              <Icon name="chevron.down" size={16} color={T.ink} />
            </View>
            <Text style={{ marginTop: 2, fontSize: 11.5, color: T.muted }}>Indiranagar · 100ft Road</Text>
          </Pressable>

          <Pressable
            onPress={() => { haptic.light(); router.push("/notifications"); }}
            style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
              alignItems: "center", justifyContent: "center", position: "relative",
            }}
          >
            <Icon name="bell.fill" size={18} color={T.ink} />
            {unread > 0 ? (
              <View
                style={{
                  position: "absolute", top: -4, right: -4,
                  minWidth: 16, height: 16, paddingHorizontal: 4,
                  borderRadius: 8, backgroundColor: T.ruby,
                  borderWidth: 2, borderColor: T.bg,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable onPress={() => { haptic.light(); router.push("/profile"); }}>
            {profile?.avatar_url ? (
              <Avatar uri={profile.avatar_url} size={40} />
            ) : (
              <View
                style={{
                  width: 40, height: 40, borderRadius: 999,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: T.saffron,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                  {initials(profile?.name ?? "")}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Greeting */}
        <View style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
          <Text style={[display(30, "600", -0.8), { lineHeight: 32 }]}>
            Hey {firstName},{"\n"}
            <Text style={{ ...display(30, "600", -0.8), color: T.muted, fontStyle: "italic" }}>
              what would you like to eat?
            </Text>
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 14 }}>
          <Pressable
            onPress={() => { haptic.light(); router.push("/discover"); }}
            style={{
              height: 52, borderRadius: 14,
              backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
              flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 12,
            }}
          >
            <Icon name="magnifyingglass" size={20} color={T.muted} />
            <Text style={{ flex: 1, color: T.muted, fontSize: 14 }}>
              Try "sushi", "date night"
            </Text>
            <View style={{ width: 1, height: 22, backgroundColor: T.hairline }} />
            <Icon name="slider.horizontal.3" size={18} color={T.ink} />
          </Pressable>
        </View>

        {/* Active order */}
        {activeOrder ? (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            <Pressable
              onPress={() => router.push({ pathname: "/order/[id]", params: { id: activeOrder.id } })}
              style={{
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
                backgroundColor: T.ink, flexDirection: "row", alignItems: "center", gap: 12,
              }}
            >
              <View
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: "rgba(255,90,31,0.18)",
                  alignItems: "center", justifyContent: "center", position: "relative",
                }}
              >
                <Icon name="flame.fill" size={20} color={T.saffron} />
                <View
                  style={{
                    position: "absolute", top: -2, right: -2,
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: T.saffron,
                    borderWidth: 2, borderColor: T.ink,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[mono(11, "600", 0.6), { color: T.amber }]}>ORDER IN PROGRESS</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: T.cream, marginTop: 1 }}>
                  {activeOrder.order_number}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: T.cream, fontSize: 12, fontWeight: "600" }}>Track</Text>
                <Icon name="arrow.right" size={14} color={T.cream} />
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Tonight's Pick */}
        {tonightPick ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHead eyebrow={`TONIGHT · ${formatDate}`} title="Tonight's pick" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 18, paddingRight: 18, gap: 12 }}
            >
              <TonightPickCard r={tonightPick} onPress={() => router.push({ pathname: "/restaurant/[id]", params: { id: tonightPick.id } })} />
            </ScrollView>
          </View>
        ) : null}

        {/* By Mood */}
        {moods && moods.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHead eyebrow="BY MOOD" title="What are you in the mood for?" />
            <View style={{ paddingHorizontal: 18, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {moods.slice(0, 8).map((m) => {
                const palette = MOOD_PALETTE[m.key] ?? { hue: 28, icon: "fork.knife" };
                const colors = moodColors(palette.hue);
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => { haptic.light(); router.push({ pathname: "/discover", params: { q: m.query } }); }}
                    style={{
                      width: "23.5%", backgroundColor: T.card, borderRadius: 14,
                      paddingHorizontal: 6, paddingVertical: 12,
                      borderWidth: 1, borderColor: T.hairline,
                      alignItems: "center", gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 38, height: 38, borderRadius: 10,
                        backgroundColor: colors.bg,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon name={palette.icon} size={18} color={colors.fg} />
                    </View>
                    <Text numberOfLines={2} style={{ fontSize: 10.5, fontWeight: "600", color: T.ink, textAlign: "center", lineHeight: 13 }}>
                      {m.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Popular Nearby */}
        {popular.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHead eyebrow="POPULAR NEARBY" title="Loved by your neighbourhood" action="See all" onAction={() => router.push("/discover")} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 18, paddingRight: 18, gap: 12 }}
            >
              {popular.map((r) => (
                <DimeRestaurantCard
                  key={r.id}
                  r={r}
                  onPress={() => router.push({ pathname: "/restaurant/[id]", params: { id: r.id } })}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Spotlight AD */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 24 }}>
          <View
            style={{
              backgroundColor: T.cream, borderRadius: 16, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 14,
              borderWidth: 1, borderColor: T.hairline, borderStyle: "dashed",
              position: "relative",
            }}
          >
            <Text style={[mono(9, "700", 1.2), { position: "absolute", top: 8, right: 10 }]}>AD</Text>
            <Img kind="brand" h={64} w={64} radius={12} hue={280} />
            <View style={{ flex: 1 }}>
              <Text style={display(16, "600")}>Sip & Savour Festival</Text>
              <Text style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>20+ rooftop bars, one curated pass.</Text>
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: T.saffron }}>Explore</Text>
                <Icon name="arrow.right" size={13} color={T.saffron} />
              </View>
            </View>
          </View>
        </View>

        {/* Editor's Picks */}
        {editorPicks.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHead eyebrow="EDITOR'S PICKS" title="Featured on DIME" action="See all" onAction={() => router.push("/discover")} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 18, paddingRight: 18, gap: 12 }}
            >
              {editorPicks.map((r) => (
                <DimeRestaurantCard
                  key={r.id}
                  r={r}
                  onPress={() => router.push({ pathname: "/restaurant/[id]", params: { id: r.id } })}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Curated Collections */}
        {collections && collections.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHead eyebrow="CURATED" title="Made for the moment" />
            <View style={{ paddingHorizontal: 18, gap: 10 }}>
              {collections.slice(0, 3).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => { haptic.light(); router.push({ pathname: "/discover", params: { q: c.name } }); }}
                  style={{
                    borderRadius: 16, overflow: "hidden",
                    backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
                    flexDirection: "row", alignItems: "stretch", height: 96,
                  }}
                >
                  <Img uri={c.cover_image_url} kind="collection" h={"100%" as unknown as number} w={110} radius={0} hue={28} />
                  <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
                    <Text style={mono(10, "700", 1.2)}>COLLECTION</Text>
                    <Text style={[display(17, "600", -0.3), { marginTop: 2 }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    {c.description ? (
                      <Text numberOfLines={1} style={{ fontSize: 12, color: T.ink2, marginTop: 1 }}>
                        {c.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignSelf: "center", paddingRight: 14 }}>
                    <Icon name="chevron.right" size={20} color={T.ink} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Order again */}
        {lastOrder ? (
          <View style={{ paddingHorizontal: 18, paddingBottom: 24 }}>
            <View
              style={{
                backgroundColor: T.card, borderRadius: 16, padding: 14,
                flexDirection: "row", alignItems: "center", gap: 12,
                borderWidth: 1, borderColor: T.hairline,
              }}
            >
              <Img kind="order" h={56} w={56} radius={12} hue={28} />
              <View style={{ flex: 1 }}>
                <Text style={mono(10.5, "700", 1)}>ORDER AGAIN</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: T.ink, marginTop: 1 }}>{lastOrder.order_number}</Text>
                <Text style={{ fontSize: 12, color: T.ink2, marginTop: 1 }}>
                  <Text style={num(12, "500")}>₹{Math.round(lastOrder.total_amount).toLocaleString("en-IN")}</Text>
                  <Text> · last ordered</Text>
                </Text>
              </View>
              <DimeBtn
                label="Reorder"
                variant="dark"
                size="sm"
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: lastOrder.id } })}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/* ───────── Tonight pick (large hero card) ───────── */

function TonightPickCard({ r, onPress }: { r: DineoutRestaurant; onPress: () => void }) {
  const distance = r.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : null;
  const cost = r.cost_for_two ?? 1200;
  const cashbackPct = r.cashback_pct ?? 0;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 320, borderRadius: 18, overflow: "hidden",
        backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
      }}
    >
      <View style={{ position: "relative" }}>
        <Img uri={r.cover_image_url} kind="restaurant" h={200} w={"100%" as unknown as number} radius={0} hue={38} />
        <View style={{ position: "absolute", top: 12, left: 12 }}>
          <Pill
            bg={T.ink}
            color={T.cream}
            size={10}
            textStyle={{ letterSpacing: 0.6, textTransform: "uppercase", fontFamily: T.fontMono }}
            icon={<Icon name="sparkles" size={11} color={T.cream} />}
          >
            Editor's Pick
          </Pill>
        </View>
        <Pressable
          style={{
            position: "absolute", top: 12, right: 12,
            width: 36, height: 36, borderRadius: 999,
            backgroundColor: T.card,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="heart" size={17} color={T.ink} />
        </Pressable>
      </View>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={display(19, "600", -0.3)} numberOfLines={1}>{r.name}</Text>
            <Text numberOfLines={1} style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {r.cuisines.slice(0, 3).join(" · ")}
            </Text>
          </View>
          <StarChip score={Number(r.rating).toFixed(1)} />
        </View>
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={num(12, "500")}>₹{cost.toLocaleString("en-IN")} for two</Text>
          <Text style={{ color: T.hairline, fontSize: 10 }}>•</Text>
          {distance ? <Text style={num(12, "500")}>{distance}</Text> : null}
          <Text style={{ color: T.hairline, fontSize: 10 }}>•</Text>
          <Text style={{ fontSize: 12, color: T.ink2 }}>{r.city}</Text>
        </View>
        <View
          style={{
            marginTop: 12, backgroundColor: T.cream, borderRadius: 10,
            paddingHorizontal: 10, paddingVertical: 8,
            flexDirection: "row", alignItems: "center", gap: 8,
          }}
        >
          <Icon name="tag.fill" size={14} color={T.saffron} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: T.ink }}>
            {cashbackPct ? `Up to ${cashbackPct}% cashback` : "Up to 25% cashback"}
          </Text>
          <Text style={{ fontSize: 12, color: T.muted, fontWeight: "500" }}>
            · pre-book to save more
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ───────── Standard restaurant card (240w) ───────── */

function DimeRestaurantCard({ r, onPress }: { r: DineoutRestaurant; onPress: () => void }) {
  const distance = r.distance_km != null ? `${Number(r.distance_km).toFixed(1)} km` : null;
  const cost = r.cost_for_two ?? 1200;
  const offerLabel = r.pre_booking_discount_pct
    ? `Flat ${r.pre_booking_discount_pct}% off`
    : `${r.cashback_pct ?? 25}% cashback`;
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 240, backgroundColor: T.card, borderRadius: 16,
        overflow: "hidden", borderWidth: 1, borderColor: T.hairline,
      }}
    >
      <View style={{ position: "relative" }}>
        <Img uri={r.cover_image_url} kind="restaurant" h={130} w={"100%" as unknown as number} radius={0} hue={28} />
        {r.featured ? (
          <Pill
            bg={T.card}
            color={T.ink}
            size={9}
            style={{ position: "absolute", top: 10, left: 10 }}
            textStyle={{ letterSpacing: 1, textTransform: "uppercase", fontFamily: T.fontMono }}
            icon={<Icon name="star.fill" size={10} color={T.amber} />}
          >
            Featured
          </Pill>
        ) : null}
        <View style={{ position: "absolute", bottom: 10, left: 10 }}>
          <StarChip score={Number(r.rating).toFixed(1)} size="sm" />
        </View>
        <Pressable
          style={{
            position: "absolute", top: 10, right: 10,
            width: 30, height: 30, borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.92)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="heart" size={14} color={T.ink} />
        </Pressable>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={display(16, "600", -0.2)} numberOfLines={1}>{r.name}</Text>
        <Text numberOfLines={2} style={{ fontSize: 11.5, color: T.muted, marginTop: 3, lineHeight: 15, height: 30 }}>
          {r.cuisines.slice(0, 3).join(" · ")}
        </Text>
        <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={num(11, "500")}>₹{cost.toLocaleString("en-IN")}</Text>
          <Text style={{ fontSize: 8, color: T.hairline }}>•</Text>
          {distance ? <Text style={num(11, "500")}>{distance}</Text> : null}
          <Text style={{ fontSize: 8, color: T.hairline }}>•</Text>
          <View
            style={{
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
              backgroundColor: T.forestSoft,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: T.forest }}>Booking</Text>
          </View>
        </View>
        <View
          style={{
            marginTop: 8, paddingHorizontal: 8, paddingVertical: 6,
            borderRadius: 8, backgroundColor: T.cream,
            flexDirection: "row", alignItems: "center", gap: 5,
          }}
        >
          <Icon name="tag.fill" size={12} color={T.saffron} />
          <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "600", color: T.ink }}>{offerLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}
