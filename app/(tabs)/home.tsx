import { useMemo } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Card, Header, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useRestaurants, useBanners, useCollections, useActiveOffers, useMyOrders } from "@/hooks/queries";
import { useUnreadNotificationCount } from "@/hooks/useNotificationListener";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { LiveAdsRail } from "@/components/poster/LiveAdsRail";
import { greeting, rupees } from "@/lib/format";
import { cn } from "@/lib/cn";

const moods: { key: string; title: string; color: string; query: string }[] = [
  { key: "quick", title: "Quick Bite", color: "bg-amber-50", query: "qsr" },
  { key: "date", title: "Date Night", color: "bg-rose-50", query: "fine_dine" },
  { key: "family", title: "Family Dinner", color: "bg-orange-50", query: "family" },
  { key: "business", title: "Business Lunch", color: "bg-slate-50", query: "business" },
  { key: "late", title: "Late Night", color: "bg-indigo-50", query: "late" },
  { key: "healthy", title: "Healthy", color: "bg-emerald-50", query: "healthy" },
  { key: "celebrate", title: "Celebration", color: "bg-purple-50", query: "celebration" },
];

export default function Home() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const { data: restaurants } = useRestaurants({ featured: true });
  const { data: allRestaurants } = useRestaurants();
  const { data: banners } = useBanners();
  const { data: collections } = useCollections();
  const { data: offers } = useActiveOffers(null);
  const { data: orders } = useMyOrders();
  const unreadNotifications = useUnreadNotificationCount();

  const lastOrder = useMemo(() => orders?.find((o) => o.status === "paid"), [orders]);
  const activeOrder = useMemo(() => orders?.find((o) => o.status !== "paid" && o.status !== "cancelled"), [orders]);

  const tierProgress = (() => {
    const pts = profile?.loyalty_points ?? 0;
    if (pts >= 5000) return { tier: "Diamond", next: 5000, progress: 1, toNext: 0 };
    if (pts >= 2000) return { tier: "Platinum", next: 5000, progress: (pts - 2000) / 3000, toNext: 5000 - pts };
    if (pts >= 500) return { tier: "Gold", next: 2000, progress: (pts - 500) / 1500, toNext: 2000 - pts };
    return { tier: "Silver", next: 500, progress: pts / 500, toNext: 500 - pts };
  })();

  return (
    <Screen>
      <Header
        title="DIME"
        right={
          <Pressable
            onPress={() => {
              haptic.light();
              router.push("/notifications");
            }}
            className="relative h-10 w-10 items-center justify-center rounded-full bg-dime-bg-2"
          >
            <Icon name="bell.fill" size={18} color="#1C1C1E" />
            {unreadNotifications > 0 ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-dime-orange-500 px-1">
                <Text className="text-[10px] font-bold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <View className="px-4">
        <Text className="text-[12px] font-semibold uppercase tracking-widest text-dime-ink-3">{greeting()}</Text>
        <View className="mt-1 flex-row items-center gap-3">
          <Text className="flex-1 text-[28px] font-semibold text-dime-ink">{profile?.name?.split(" ")[0] ?? "there"}</Text>
          <Avatar name={profile?.name} uri={profile?.avatar_url} size={44} ring />
        </View>
      </View>

      {/* Loyalty card */}
      <View className="mt-5 px-4">
        <Pressable
          onPress={() => {
            haptic.light();
            router.push("/loyalty");
          }}
          className="overflow-hidden rounded-2xl"
          style={{ shadowColor: "#FC8019", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 }}
        >
          <View style={{ backgroundColor: "#FC8019" }}>
            <View className="relative p-5" style={{ backgroundColor: "rgba(255,215,0,0.25)" }}>
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-white/90">Loyalty Points</Text>
                  <Text className="mt-1 text-[36px] font-semibold text-white">{profile?.loyalty_points ?? 0}</Text>
                  <View className="mt-1 self-start rounded-full bg-white/25 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-white">{tierProgress.tier} Member</Text>
                  </View>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Icon name="crown.fill" size={22} color="#fff" />
                </View>
              </View>

              <View className="mt-4">
                <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <View className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(4, tierProgress.progress * 100))}%` }} />
                </View>
                <Text className="mt-1.5 text-[11px] text-white/90">
                  {tierProgress.toNext > 0 ? `${tierProgress.toNext} points to next tier` : "Top tier reached!"}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Active order / last visit banner */}
      {activeOrder ? (
        <Pressable
          onPress={() => router.push({ pathname: "/order/[id]", params: { id: activeOrder.id } })}
          className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl border border-dime-orange-200 bg-dime-orange-50 p-3"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-dime-orange-500">
            <Icon
              name={activeOrder.status === "ready" ? "checkmark.circle.fill" : activeOrder.status === "preparing" ? "flame.fill" : "bag.fill"}
              size={18}
              color="#fff"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-dime-orange-700">
              {activeOrder.status === "received" ? "Order received" :
               activeOrder.status === "preparing" ? "Kitchen is cooking" :
               activeOrder.status === "ready" ? "Your food is ready!" :
               activeOrder.status === "served" ? "Enjoy your meal" :
               "Order in progress"}
            </Text>
            <Text className="text-[12px] text-dime-ink-2">{activeOrder.order_number} • Tap to track live</Text>
          </View>
          <Icon name="chevron.right" size={16} color="#B85A0B" />
        </Pressable>
      ) : null}

      {/* Offers */}
      {offers && offers.length > 0 ? (
        <View className="mt-6">
          <View className="mb-3 flex-row items-center justify-between px-4">
            <Text className="text-[20px] font-semibold text-dime-ink">Active Offers</Text>
            <Icon name="gift.fill" size={20} color="#FC8019" />
          </View>
          <FlatList
            horizontal
            data={offers}
            keyExtractor={(o) => o.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Card className="mr-3 w-[280px]">
                <Card.Body>
                  <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-orange-600">
                    {item.promo_code ?? "Offer"}
                  </Text>
                  <Text className="mt-1 text-[16px] font-semibold text-dime-ink">{item.title}</Text>
                  <Text numberOfLines={2} className="mt-1 text-[12px] text-dime-ink-3">{item.description}</Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-[12px] text-dime-ink-2">Min {rupees(item.min_order_amount)}</Text>
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-dime-orange-50">
                      <Text className="text-[13px] font-bold text-dime-orange-700">
                        {item.discount_type === "percentage" ? `${item.discount_value}%` : `₹${item.discount_value}`}
                      </Text>
                    </View>
                  </View>
                </Card.Body>
              </Card>
            )}
          />
        </View>
      ) : null}

      {/* Sponsored ads */}
      <View className="mt-6">
        <View className="mb-3 flex-row items-center justify-between px-4">
          <Text className="text-[20px] font-semibold text-dime-ink">Spotlight</Text>
          <Text className="text-[10px] uppercase tracking-widest text-dime-ink-3">Sponsored</Text>
        </View>
        <LiveAdsRail placement="home_banner" limit={6} />
      </View>

      {/* Food Mood */}
      <View className="mt-6">
        <View className="mb-3 flex-row items-center justify-between px-4">
          <Text className="text-[20px] font-semibold text-dime-ink">Food Mood</Text>
        </View>
        <FlatList
          horizontal
          data={moods}
          keyExtractor={(m) => m.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                haptic.light();
                router.push({ pathname: "/discover", params: { q: item.query } });
              }}
              className={cn("mr-3 h-[100px] w-[100px] items-center justify-center rounded-2xl", item.color)}
            >
              <Text className="text-center text-[13px] font-semibold text-dime-ink">{item.title}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Featured */}
      <View className="mt-6 px-4">
        <Text className="mb-3 text-[20px] font-semibold text-dime-ink">Featured Restaurants</Text>
        <View className="flex-row flex-wrap gap-3">
          {restaurants?.map((r) => (
            <View key={r.id} className="w-[48%]">
              <RestaurantCard restaurant={r} />
            </View>
          ))}
        </View>
      </View>

      {/* Collections */}
      {collections && collections.length > 0 ? (
        <View className="mt-6">
          <Text className="mb-3 px-4 text-[20px] font-semibold text-dime-ink">Curated for you</Text>
          <FlatList
            horizontal
            data={collections}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Pressable className="mr-3 w-64 overflow-hidden rounded-2xl bg-white">
                <Image source={{ uri: item.cover_image_url ?? "" }} className="h-36 w-full" />
                <View className="p-3">
                  <Text className="text-[15px] font-semibold text-dime-ink">{item.name}</Text>
                  <Text numberOfLines={2} className="mt-0.5 text-[12px] text-dime-ink-3">{item.description}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* Trending */}
      <View className="mt-6 px-4">
        <Text className="mb-3 text-[20px] font-semibold text-dime-ink">Popular nearby</Text>
        <View className="gap-3">
          {allRestaurants?.slice(0, 4).map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </View>
      </View>

      {lastOrder ? (
        <View className="mt-6 px-4">
          <Text className="mb-3 text-[20px] font-semibold text-dime-ink">Reorder your last visit</Text>
          <Card>
            <Card.Body>
              <Text className="text-[15px] font-semibold text-dime-ink">{lastOrder.order_number}</Text>
              <Text className="mt-1 text-[12px] text-dime-ink-3">{rupees(lastOrder.total_amount)}</Text>
            </Card.Body>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
