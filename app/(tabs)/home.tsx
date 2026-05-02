import { useMemo } from "react";
import { FlatList, Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Avatar, DottedUnderline, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import {
  useRestaurants,
  useCollections,
  useMyOrders,
  useMoodCategories,
  type DineoutRestaurant,
} from "@/hooks/queries";
import { useUnreadNotificationCount } from "@/hooks/useNotificationListener";
import { HeroRestaurantCard } from "@/components/restaurant/HeroRestaurantCard";
import { DineoutCard } from "@/components/restaurant/DineoutCard";
import { MoodTile } from "@/components/restaurant/MoodTile";
import { LiveAdsRail } from "@/components/poster/LiveAdsRail";
import { rupees } from "@/lib/format";
import { surface, brand } from "@/lib/visual";

function SectionTitle({
  eyebrow,
  title,
  trailing,
  onPress,
}: {
  eyebrow?: string;
  title: string;
  trailing?: string;
  onPress?: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
      {eyebrow ? (
        <Text style={{ fontSize: 10, fontWeight: "800", color: brand.orange500, letterSpacing: 1.6 }}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={{ marginTop: eyebrow ? 4 : 0, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: surface.ink, letterSpacing: -0.6 }}>
          {title}
        </Text>
        {trailing ? (
          <Pressable onPress={onPress} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: brand.orange500 }}>{trailing}</Text>
            <Icon name="chevron.right" size={11} color={brand.orange500} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const profile = useAuth((s) => s.profile);
  const { data: featured } = useRestaurants({ featured: true });
  const { data: allRestaurants } = useRestaurants();
  const { data: collections } = useCollections();
  const { data: orders } = useMyOrders();
  const { data: moods } = useMoodCategories();
  const unreadNotifications = useUnreadNotificationCount();

  const activeOrder = useMemo(() => orders?.find((o) => o.status !== "paid" && o.status !== "cancelled"), [orders]);
  const lastOrder = useMemo(() => orders?.find((o) => o.status === "paid"), [orders]);

  const isMobile = width < 500;
  const collectionWidth = isMobile ? width * 0.74 : 300;
  const spotlightWidth = isMobile ? width - 40 : 320;

  const heroPick = (featured?.[0] ?? allRestaurants?.[0]) as DineoutRestaurant | undefined;
  const popular = (allRestaurants ?? []).filter((r) => r.id !== heroPick?.id).slice(0, 4) as DineoutRestaurant[];
  const topPicks = (featured ?? []).filter((r) => r.id !== heroPick?.id) as DineoutRestaurant[];

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <Screen>
      {/* ─────────────────── Hero header ─────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        {/* Top row: location + actions */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => { haptic.light(); router.push("/discover"); }}
            style={{ flex: 1, paddingRight: 12 }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: brand.orange500, letterSpacing: 1.6 }}>
              DELIVER TO
            </Text>
            <View style={{ marginTop: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="mappin" size={14} color={surface.ink} />
              <DottedUnderline textStyle={{ fontSize: 17, fontWeight: "800", color: surface.ink, letterSpacing: -0.4 }}>
                Bangalore
              </DottedUnderline>
              <Icon name="chevron.down" size={11} color={surface.ink2} />
            </View>
            <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: surface.ink3 }}>
              Indiranagar · 100ft Road
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={() => { haptic.light(); router.push("/notifications"); }}
              style={{
                position: "relative",
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: "#fff",
                borderWidth: 1, borderColor: surface.hairline,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="bell.fill" size={17} color={surface.ink} />
              {unreadNotifications > 0 ? (
                <View
                  style={{
                    position: "absolute", top: -2, right: -2,
                    height: 18, minWidth: 18, paddingHorizontal: 4,
                    borderRadius: 9,
                    backgroundColor: brand.orange500,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 2, borderColor: "#fff",
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => { haptic.light(); router.push("/profile"); }}>
              <Avatar name={profile?.name} uri={profile?.avatar_url} size={42} />
            </Pressable>
          </View>
        </View>

        {/* Editorial title */}
        <View style={{ marginTop: 22 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: surface.ink, letterSpacing: -1, lineHeight: 32 }}>
            Hey {firstName},
          </Text>
          <Text style={{ marginTop: 2, fontSize: 28, fontWeight: "300", color: surface.ink2, letterSpacing: -0.8, lineHeight: 32 }}>
            what would you like to eat?
          </Text>
        </View>

        {/* Search */}
        <Pressable
          onPress={() => router.push("/discover")}
          style={{
            marginTop: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#fff",
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: "#F0E6DC",
            shadowColor: "#FC8019",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: "#FFF1E0",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="magnifyingglass" size={15} color={brand.orange500} />
          </View>
          <Text style={{ flex: 1, fontSize: 14, color: surface.ink2, fontWeight: "500" }}>
            Try <Text style={{ color: surface.ink, fontWeight: "700" }}>"sushi"</Text>, <Text style={{ color: surface.ink, fontWeight: "700" }}>"date night"</Text>
          </Text>
          <View
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: "#F8F8F8",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="slider.horizontal.3" size={14} color={surface.ink} />
          </View>
        </Pressable>
      </View>

      {/* Active order */}
      {activeOrder ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/order/[id]", params: { id: activeOrder.id } })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 18,
              backgroundColor: "#FFF4EF",
              borderWidth: 1,
              borderColor: "#FFD9C5",
            }}
          >
            <View
              style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: brand.orange500,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon
                name={activeOrder.status === "ready" ? "checkmark.circle.fill" : activeOrder.status === "preparing" ? "flame.fill" : "bag.fill"}
                size={18} color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: surface.ink }}>
                {activeOrder.status === "received" ? "Order placed" :
                 activeOrder.status === "preparing" ? "Preparing your food" :
                 activeOrder.status === "ready" ? "Your food is ready!" :
                 activeOrder.status === "served" ? "Enjoy your meal" : "Order in progress"}
              </Text>
              <Text style={{ marginTop: 1, fontSize: 12, color: surface.ink3 }}>
                {activeOrder.order_number} · Tap to track →
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* ─────────────────── Hero pick (editorial) ─────────────────── */}
      {heroPick ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <HeroRestaurantCard restaurant={heroPick} eyebrow="TONIGHT'S PICK" />
        </View>
      ) : null}

      {/* ─────────────────── By mood ─────────────────── */}
      {moods && moods.length > 0 ? (
        <View>
          <SectionTitle eyebrow="BY MOOD" title="What are you in the mood for?" />
          <FlatList
            horizontal
            data={moods}
            keyExtractor={(m) => m.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 10 }}
            renderItem={({ item }) => (
              <MoodTile
                moodKey={item.key}
                title={item.title}
                iconUrl={item.icon_url}
                onPress={() => router.push({ pathname: "/discover", params: { q: item.query } })}
              />
            )}
          />
        </View>
      ) : null}

      {/* ─────────────────── Popular nearby ─────────────────── */}
      <View>
        <SectionTitle
          eyebrow="POPULAR NEARBY"
          title="Loved by your neighbourhood"
          trailing="See all"
          onPress={() => router.push("/discover")}
        />
        <View style={{ paddingHorizontal: 20, gap: 14, paddingBottom: 6 }}>
          {popular.map((r) => (
            <DineoutCard key={r.id} restaurant={r} />
          ))}
        </View>
      </View>

      {/* ─────────────────── Spotlight (ads) ─────────────────── */}
      <View>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 10, fontWeight: "800", color: surface.ink3, letterSpacing: 1.6 }}>SPOTLIGHT</Text>
            <Text style={{ marginTop: 4, fontSize: 22, fontWeight: "800", color: surface.ink, letterSpacing: -0.6 }}>
              Worth a look
            </Text>
          </View>
          <View style={{ borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "#F2F2F2" }}>
            <Text style={{ fontSize: 9, fontWeight: "800", color: surface.ink3, letterSpacing: 0.5 }}>AD</Text>
          </View>
        </View>
        <LiveAdsRail placement="home_banner" limit={6} mobileWidth={spotlightWidth} />
      </View>

      {/* ─────────────────── Featured restaurants horizontal ─────────────────── */}
      {topPicks.length > 0 ? (
        <View>
          <SectionTitle
            eyebrow="EDITOR'S PICKS"
            title="Featured on DIME"
            trailing="See all"
            onPress={() => router.push({ pathname: "/discover", params: { q: "fine_dine" } })}
          />
          <FlatList
            horizontal
            data={topPicks.slice(0, 6)}
            keyExtractor={(r) => r.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6, gap: 14 }}
            renderItem={({ item }) => (
              <View style={{ width: 240 }}>
                <DineoutCard restaurant={item} />
              </View>
            )}
          />
        </View>
      ) : null}

      {/* ─────────────────── Curated collections ─────────────────── */}
      {collections && collections.length > 0 ? (
        <View>
          <SectionTitle eyebrow="CURATED" title="Made for the moment" />
          <FlatList
            horizontal
            data={collections}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { haptic.light(); router.push({ pathname: "/discover", params: { q: item.name } }); }}
                style={{
                  width: collectionWidth,
                  height: 200,
                  borderRadius: 22,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: surface.hairline,
                }}
              >
                <Image source={{ uri: item.cover_image_url ?? "" }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end" }}
                  locations={[0, 0.4, 1]}
                >
                  <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.85)", letterSpacing: 1.5 }}>
                      COLLECTION
                    </Text>
                    <Text style={{ marginTop: 4, fontSize: 19, fontWeight: "800", color: "#fff", letterSpacing: -0.4 }}>
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </LinearGradient>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* ─────────────────── Reorder ─────────────────── */}
      {lastOrder ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 28 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/order/[id]", params: { id: lastOrder.id } })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 14,
              borderRadius: 18,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: surface.hairline,
            }}
          >
            <View
              style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: "#F8F8F8",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="arrow.counterclockwise" size={18} color={surface.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: surface.ink3, letterSpacing: 1.4 }}>
                ORDER AGAIN
              </Text>
              <Text style={{ marginTop: 2, fontSize: 15, fontWeight: "800", color: surface.ink, letterSpacing: -0.3 }}>
                {lastOrder.order_number}
              </Text>
              <Text style={{ marginTop: 1, fontSize: 12, color: surface.ink3 }}>
                {rupees(lastOrder.total_amount)} · last ordered
              </Text>
            </View>
            <Icon name="chevron.right" size={14} color={surface.ink3} />
          </Pressable>
        </View>
      ) : null}

      <View style={{ height: 32 }} />
    </Screen>
  );
}
