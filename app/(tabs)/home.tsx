import { useMemo } from "react";
import { FlatList, Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Avatar, Card, Header, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useRestaurants, useBanners, useCollections, useActiveOffers, useMyOrders, useMoodCategories } from "@/hooks/queries";
import { useUnreadNotificationCount } from "@/hooks/useNotificationListener";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { LiveAdsRail } from "@/components/poster/LiveAdsRail";
import { greeting, rupees } from "@/lib/format";
import { cn } from "@/lib/cn";

const fallbackIcons: Record<string, string> = {
  quick: "bolt.fill",
  date: "heart.fill",
  family: "person.3.fill",
  business: "briefcase.fill",
  late: "moon.fill",
  healthy: "leaf.fill",
  celebrate: "party.popper.fill",
};

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const profile = useAuth((s) => s.profile);
  const { data: restaurants } = useRestaurants({ featured: true });
  const { data: allRestaurants } = useRestaurants();
  const { data: banners } = useBanners();
  const { data: collections } = useCollections();
  const { data: offers } = useActiveOffers(null);
  const { data: orders } = useMyOrders();
  const { data: moods } = useMoodCategories();
  const unreadNotifications = useUnreadNotificationCount();

  const activeOrder = useMemo(() => orders?.find((o) => o.status !== "paid" && o.status !== "cancelled"), [orders]);
  const lastOrder = useMemo(() => orders?.find((o) => o.status === "paid"), [orders]);

  const isMobile = width < 500;
  const cardWidth = isMobile ? width * 0.6 : 260;
  const collectionWidth = isMobile ? width * 0.7 : 280;
  const spotlightWidth = isMobile ? width - 60 : 320;

  const tierProgress = (() => {
    const pts = profile?.loyalty_points ?? 0;
    if (pts >= 5000) return { tier: "Diamond", next: 5000, progress: 1, toNext: 0 };
    if (pts >= 2000) return { tier: "Platinum", next: 5000, progress: (pts - 2000) / 3000, toNext: 5000 - pts };
    if (pts >= 500) return { tier: "Gold", next: 2000, progress: (pts - 500) / 1500, toNext: 2000 - pts };
    return { tier: "Silver", next: 500, progress: pts / 500, toNext: 500 - pts };
  })();

  return (
    <Screen>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <View className="flex-row items-center gap-3">
          <Avatar name={profile?.name} uri={profile?.avatar_url} size={42} ring />
          <View>
            <Text className="text-[12px] font-semibold uppercase text-dime-ink-3" style={{ letterSpacing: 1.5 }}>
              {greeting()}
            </Text>
            <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
              {profile?.name?.split(" ")[0] ?? "there"}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => { haptic.light(); router.push("/notifications"); }}
          className="relative h-11 w-11 items-center justify-center rounded-full bg-dime-bg-2"
        >
          <Icon name="bell.fill" size={18} color="#0F0F0F" />
          {unreadNotifications > 0 ? (
            <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-dime-primary-500 px-1">
              <Text className="text-[9px] font-bold text-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Active order banner */}
      {activeOrder ? (
        <Pressable
          onPress={() => router.push({ pathname: "/order/[id]", params: { id: activeOrder.id } })}
          className="mx-5 mt-3 flex-row items-center gap-3 rounded-2xl bg-dime-ink p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <Icon
              name={activeOrder.status === "ready" ? "checkmark.circle.fill" : activeOrder.status === "preparing" ? "flame.fill" : "bag.fill"}
              size={18}
              color="#fff"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-white">
              {activeOrder.status === "received" ? "Order received" :
               activeOrder.status === "preparing" ? "Kitchen is cooking" :
               activeOrder.status === "ready" ? "Your food is ready!" :
               activeOrder.status === "served" ? "Enjoy your meal" :
               "Order in progress"}
            </Text>
            <Text className="text-[12px] text-white/60">{activeOrder.order_number} · Tap to track</Text>
          </View>
          <Icon name="chevron.right" size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>
      ) : null}

      {/* Loyalty card */}
      <View className="mt-5 px-5">
        <Pressable
          onPress={() => { haptic.light(); router.push("/loyalty"); }}
          className="overflow-hidden rounded-[22px]"
          style={{ shadowColor: "#C9A96E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}
        >
          <LinearGradient
            colors={["#1A1A1A", "#2D2D2D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5"
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase text-dime-gold" style={{ letterSpacing: 2 }}>
                  DIME Rewards
                </Text>
                <Text className="mt-2 text-[36px] font-bold text-white" style={{ letterSpacing: -1 }}>
                  {profile?.loyalty_points ?? 0}
                </Text>
                <View className="mt-1.5 self-start rounded-full bg-white/10 px-3 py-1">
                  <Text className="text-[10px] font-bold uppercase text-dime-gold-light" style={{ letterSpacing: 1 }}>
                    {tierProgress.tier} Member
                  </Text>
                </View>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-full bg-dime-gold/20">
                <Icon name="crown.fill" size={22} color="#C9A96E" />
              </View>
            </View>
            <View className="mt-5">
              <View className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <View
                  className="h-full rounded-full bg-dime-gold"
                  style={{ width: `${Math.min(100, Math.max(4, tierProgress.progress * 100))}%` }}
                />
              </View>
              <Text className="mt-2 text-[11px] text-white/50">
                {tierProgress.toNext > 0 ? `${tierProgress.toNext} points to next tier` : "You've reached the top!"}
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Food Mood — dynamic icons from admin */}
      <View className="mt-8">
        <Text className="mb-4 px-5 text-[11px] font-bold uppercase text-dime-ink-3" style={{ letterSpacing: 1.5 }}>
          What are you in the mood for?
        </Text>
        <FlatList
          horizontal
          data={moods ?? []}
          keyExtractor={(m) => m.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { haptic.light(); router.push({ pathname: "/discover", params: { q: item.query } }); }}
              className="mr-4 items-center"
              style={({ pressed }) => (pressed ? { transform: [{ scale: 0.95 }] } : undefined)}
            >
              <View
                className="h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-2xl bg-dime-bg-2"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
              >
                {item.icon_url ? (
                  <Image
                    source={{ uri: item.icon_url }}
                    className="h-[40px] w-[40px]"
                    resizeMode="contain"
                  />
                ) : (
                  <Icon
                    name={fallbackIcons[item.key] ?? "questionmark.circle"}
                    size={26}
                    color="#FF6B2C"
                  />
                )}
              </View>
              <Text className="mt-2 w-[68px] text-center text-[11px] font-bold text-dime-ink-2">
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Offers carousel */}
      {offers && offers.length > 0 ? (
        <View className="mt-8">
          <SectionHeader title="Exclusive Offers" action="See all" onAction={() => router.push("/offers")} />
          <FlatList
            horizontal
            data={offers}
            keyExtractor={(o) => o.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <View
                className="mr-3 overflow-hidden rounded-2xl bg-white p-4"
                style={{ width: cardWidth, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="rounded-full bg-dime-primary-50 px-3 py-1">
                    <Text className="text-[11px] font-bold text-dime-primary-600" style={{ letterSpacing: 0.5 }}>
                      {item.promo_code ?? "OFFER"}
                    </Text>
                  </View>
                  <Text className="text-[20px] font-bold text-dime-primary-500">
                    {item.discount_type === "percentage" ? `${item.discount_value}%` : `₹${item.discount_value}`}
                  </Text>
                </View>
                <Text className="mt-3 text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.2 }}>
                  {item.title}
                </Text>
                <Text numberOfLines={2} className="mt-1 text-[12px] text-dime-ink-3">
                  {item.description}
                </Text>
                <Text className="mt-3 text-[11px] text-dime-ink-4">Min {rupees(item.min_order_amount)}</Text>
              </View>
            )}
          />
        </View>
      ) : null}

      {/* Spotlight / Ads — mobile optimized */}
      <View className="mt-8">
        <SectionHeader title="Spotlight" trailing={
          <Text className="text-[9px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Sponsored</Text>
        } />
        <LiveAdsRail placement="home_banner" limit={6} mobileWidth={spotlightWidth} />
      </View>

      {/* Featured Restaurants — responsive grid */}
      <View className="mt-8 px-5">
        <SectionHeader title="Featured Restaurants" padded={false} />
        {isMobile ? (
          <View className="mt-1 gap-4">
            {restaurants?.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </View>
        ) : (
          <View className="mt-1 flex-row flex-wrap gap-4">
            {restaurants?.map((r) => (
              <View key={r.id} className="w-[48%]">
                <RestaurantCard restaurant={r} />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Curated Collections */}
      {collections && collections.length > 0 ? (
        <View className="mt-8">
          <SectionHeader title="Curated for You" />
          <FlatList
            horizontal
            data={collections}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <Pressable
                className="mr-4 overflow-hidden rounded-2xl bg-white"
                style={{ width: collectionWidth, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}
              >
                <Image source={{ uri: item.cover_image_url ?? "" }} className="h-40 w-full" resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.6)"]}
                  className="absolute inset-x-0 bottom-0 h-24 justify-end p-4"
                  style={{ top: undefined }}
                >
                  <Text className="text-[16px] font-bold text-white" style={{ letterSpacing: -0.3 }}>
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} className="mt-0.5 text-[12px] text-white/70">
                    {item.description}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* Popular nearby */}
      <View className="mt-8 px-5">
        <SectionHeader title="Popular Nearby" padded={false} />
        <View className="mt-1 gap-4">
          {allRestaurants?.slice(0, 4).map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </View>
      </View>

      {/* Reorder */}
      {lastOrder ? (
        <View className="mt-8 px-5 pb-6">
          <SectionHeader title="Reorder" padded={false} />
          <View
            className="mt-1 flex-row items-center gap-4 rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-dime-bg-2">
              <Icon name="arrow.counterclockwise" size={18} color="#8A8A8A" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-dime-ink">{lastOrder.order_number}</Text>
              <Text className="mt-0.5 text-[13px] text-dime-ink-3">{rupees(lastOrder.total_amount)}</Text>
            </View>
            <Icon name="chevron.right" size={14} color="#BFBFBF" />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
  trailing,
  padded = true,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  trailing?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <View className={cn("mb-4 flex-row items-center justify-between", padded && "px-5")}>
      <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text className="text-[13px] font-semibold text-dime-primary-500">{action}</Text>
        </Pressable>
      ) : trailing ?? null}
    </View>
  );
}
