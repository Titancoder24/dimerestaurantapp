import { useEffect, useRef } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { cn } from "@/lib/cn";
import { useOwnedRestaurant } from "@/hooks/owner";

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
  { href: "/owner/help", label: "Help", icon: "info.circle", group: "Support" },
  { href: "/owner/settings", label: "Settings", icon: "gear", group: "Support", ownerOnly: true },
];

const ownerPrimaryTabs = ["/owner/dashboard", "/owner/kitchen", "/owner/orders", "/owner/tables"];

export default function OwnerLayout() {
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const hydrated = useAuth((s) => s.hydrated);
  const profile = useAuth((s) => s.profile);
  const { data: restaurant, isLoading: restaurantLoading } = useOwnedRestaurant();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const wideScreen = width >= 900;
  const redirected = useRef(false);

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

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-dime-bg-grouped">
      <View className="flex-1 flex-row">
        {wideScreen ? (
          <View className="w-[240px] border-r border-neutral-50 bg-white px-3 py-5">
            <View className="mb-5 px-2">
              <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{isManager ? "Manager view" : "Restaurant"}</Text>
              <Text className="mt-1 text-[16px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{restaurant?.name ?? "Owner"}</Text>
              <Text className="text-[11px] text-dime-ink-3">{restaurant?.city}</Text>
              {isManager ? (
                <View className="mt-2 self-start rounded-full bg-blue-50 px-2 py-0.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Manager</Text>
                </View>
              ) : null}
            </View>
            <ScrollView>
              {visibleNav.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Pressable
                    key={n.href}
                    onPress={() => { haptic.light(); router.push(n.href as never); }}
                    className={cn("mb-1 flex-row items-center gap-4 rounded-xl px-3 py-2.5", active ? "bg-dime-primary-50" : "bg-transparent")}
                  >
                    <Icon name={n.icon} size={16} color={active ? "#FF6B2C" : "#8A8A8A"} />
                    <Text className={cn("text-[14px]", active ? "font-bold text-dime-primary-700" : "text-dime-ink-2")}>{n.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
