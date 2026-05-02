import { useEffect, useRef } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import { Platform, Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/store/auth";
import { Avatar, Icon, haptic } from "@/components/ui";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { cn } from "@/lib/cn";
import { useOwnedRestaurant } from "@/hooks/owner";
import { supabase } from "@/lib/supabase";

type NavItem = { href: string; label: string; icon: string; group: string; ownerOnly?: boolean };
const nav: NavItem[] = [
  { href: "/owner/dashboard", label: "Dashboard", icon: "chart.line.uptrend.xyaxis", group: "Operations" },
  { href: "/owner/kitchen", label: "Kitchen", icon: "flame.fill", group: "Operations" },
  { href: "/owner/orders", label: "Orders", icon: "bag.fill", group: "Operations" },
  { href: "/owner/tables", label: "Tables", icon: "tablecells", group: "Operations" },
  { href: "/owner/bookings", label: "Bookings", icon: "calendar", group: "Operations" },
  { href: "/owner/menu", label: "Menu", icon: "fork.knife", group: "Catalogue" },
  { href: "/owner/menu-designer", label: "Menu Creator", icon: "photo.fill", group: "Catalogue" },
  { href: "/owner/inventory", label: "Inventory", icon: "shippingbox.fill", group: "Catalogue" },
  { href: "/owner/analytics", label: "Analytics", icon: "chart.bar.fill", group: "Insights" },
  { href: "/owner/staff", label: "Staff", icon: "person.fill", group: "Team", ownerOnly: true },
  { href: "/owner/offers", label: "Offers", icon: "gift.fill", group: "Marketing" },
  { href: "/owner/ads", label: "Ads", icon: "sparkles", group: "Marketing" },
  { href: "/owner/reviews", label: "Reviews", icon: "star.fill", group: "Marketing" },
  { href: "/owner/notifications", label: "Notifications", icon: "bell.fill", group: "Support" },
  { href: "/owner/help", label: "Help", icon: "info.circle", group: "Support" },
  { href: "/owner/settings", label: "Settings", icon: "gear", group: "Support", ownerOnly: true },
];

const ownerPrimaryTabs = ["/owner/dashboard", "/owner/kitchen", "/owner/orders", "/owner/tables"];
const groupOrder = ["Operations", "Catalogue", "Insights", "Team", "Marketing", "Support"];

export default function OwnerLayout() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const hydrated = useAuth((s) => s.hydrated);
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);
  const { data: restaurant, isLoading: restaurantLoading } = useOwnedRestaurant();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const wideScreen = width >= 900;
  const redirected = useRef(false);

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notif-count", profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile!.id)
        .eq("is_read", false);
      if (error) return 0;
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!hydrated || redirected.current) return;
    if (!session) {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/login"));
      return;
    }
    if (!profile) return;
    if (profile.role !== "owner" && profile.role !== "manager" && profile.role !== "super_admin") {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/home"));
      return;
    }
    if (profile.role === "owner" && !restaurantLoading && restaurant === null && !pathname.endsWith("/onboarding")) {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/owner/onboarding"));
    }
  }, [hydrated, session, profile, restaurantLoading, restaurant, pathname, router]);

  if (!hydrated || !session || !profile) return null;
  if (profile.role !== "owner" && profile.role !== "manager" && profile.role !== "super_admin") return null;

  const isManager = profile?.role === "manager";
  const visibleNav = isManager ? nav.filter((n) => !n.ownerOnly) : nav;

  const grouped: Record<string, NavItem[]> = {};
  for (const n of visibleNav) {
    grouped[n.group] = grouped[n.group] ?? [];
    grouped[n.group]!.push(n);
  }

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out? You can sign back in anytime.")) return;
    }
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-50">
      <View className="flex-1 flex-row">
        {wideScreen ? (
          <View className="w-[260px] bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 1, height: 0 }, shadowOpacity: 0.04, shadowRadius: 20, borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.04)" }}>
            {/* Restaurant header */}
            <View className="px-5 pb-4 pt-6">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.2 }}>{isManager ? "Manager" : "Restaurant"}</Text>
                  <Text className="mt-1 text-[17px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }} numberOfLines={1}>{restaurant?.name ?? "Owner"}</Text>
                  {restaurant?.city ? <Text className="text-[12px] text-dime-ink-3">{restaurant.city}</Text> : null}
                </View>
                <Pressable onPress={() => router.push("/owner/notifications" as never)} className="relative mt-1">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
                    <Icon name="bell.fill" size={15} color="#737373" />
                  </View>
                  {(unreadCount ?? 0) > 0 ? (
                    <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-dime-primary-500 px-1">
                      <Text className="text-[9px] font-bold text-white">{unreadCount! > 9 ? "9+" : unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            </View>

            <View className="mx-5 mb-4 h-px bg-neutral-100" />

            {/* Profile */}
            <View className="mx-5 mb-4 flex-row items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
              <Avatar name={profile.name} uri={profile.avatar_url} size={32} />
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-dime-ink" numberOfLines={1}>{profile.name ?? "Owner"}</Text>
                {isManager ? (
                  <Text className="text-[10px] font-bold uppercase text-blue-600" style={{ letterSpacing: 0.8 }}>Manager</Text>
                ) : (
                  <Text className="text-[10px] font-bold uppercase text-dime-primary-500" style={{ letterSpacing: 0.8 }}>Owner</Text>
                )}
              </View>
            </View>

            {/* Nav groups */}
            <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
              {groupOrder.filter((g) => grouped[g]).map((g) => (
                <View key={g} className="mb-4">
                  <Text className="mb-1.5 px-3 text-[10px] font-bold uppercase text-neutral-400" style={{ letterSpacing: 1.2 }}>{g}</Text>
                  {grouped[g]!.map((n) => {
                    const active = pathname.startsWith(n.href);
                    const isNotif = n.href.includes("notifications");
                    return (
                      <Pressable
                        key={n.href}
                        onPress={() => { haptic.light(); router.push(n.href as never); }}
                        className={cn("mb-0.5 flex-row items-center gap-3 rounded-lg px-3 py-2", active ? "bg-dime-primary-50" : "bg-transparent")}
                      >
                        <View className={cn("h-7 w-7 items-center justify-center rounded-lg", active ? "bg-dime-primary-500" : "bg-neutral-100")}>
                          <Icon name={n.icon} size={13} color={active ? "#fff" : "#737373"} />
                        </View>
                        <Text className={cn("flex-1 text-[13px]", active ? "font-semibold text-dime-primary-700" : "text-dime-ink-2")}>{n.label}</Text>
                        {isNotif && (unreadCount ?? 0) > 0 ? (
                          <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-dime-primary-500 px-1.5">
                            <Text className="text-[10px] font-bold text-white">{unreadCount! > 9 ? "9+" : unreadCount}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <View className="h-4" />
            </ScrollView>

            {/* Sign out */}
            <View className="mx-5 mb-2 h-px bg-neutral-100" />
            <Pressable
              onPress={handleSignOut}
              className="mx-3 mb-5 flex-row items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                <Icon name="arrow.right" size={13} color="#EF4444" />
              </View>
              <Text className="text-[13px] font-medium text-red-500">Sign out</Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-1">
          <Slot />
          {!wideScreen ? (
            <MobileBottomNav items={visibleNav} primary={ownerPrimaryTabs} />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
