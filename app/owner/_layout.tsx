import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useOwnedRestaurant } from "@/hooks/owner";

const nav: { href: string; label: string; icon: string }[] = [
  { href: "/owner/dashboard", label: "Dashboard", icon: "chart.line.uptrend.xyaxis" },
  { href: "/owner/kitchen", label: "Kitchen", icon: "flame.fill" },
  { href: "/owner/orders", label: "Orders", icon: "bag.fill" },
  { href: "/owner/tables", label: "Tables", icon: "tablecells" },
  { href: "/owner/bookings", label: "Bookings", icon: "calendar" },
  { href: "/owner/menu", label: "Menu", icon: "fork.knife" },
  { href: "/owner/inventory", label: "Inventory", icon: "shippingbox.fill" },
  { href: "/owner/analytics", label: "Analytics", icon: "chart.bar.fill" },
  { href: "/owner/staff", label: "Staff", icon: "person.fill" },
  { href: "/owner/offers", label: "Offers", icon: "gift.fill" },
  { href: "/owner/reviews", label: "Reviews", icon: "star.fill" },
  { href: "/owner/settings", label: "Settings", icon: "gear" },
];

export default function OwnerLayout() {
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const { data: restaurant } = useOwnedRestaurant();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wideScreen = width >= 900;

  if (!session) return <Redirect href="/login" />;
  if (profile && profile.role !== "owner" && profile.role !== "manager" && profile.role !== "super_admin") {
    return <Redirect href="/home" />;
  }
  // Owners with no restaurant yet need to onboard first.
  if (profile?.role === "owner" && restaurant === null && !pathname.endsWith("/onboarding")) {
    return <Redirect href="/owner/onboarding" />;
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-dime-bg-grouped">
      <View className="flex-1 flex-row">
        {wideScreen ? (
          <View className="w-[240px] border-r border-dime-border bg-white px-3 py-4">
            <View className="mb-5 px-2">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">Restaurant</Text>
              <Text className="mt-1 text-[16px] font-semibold text-dime-ink" numberOfLines={1}>{restaurant?.name ?? "Owner"}</Text>
              <Text className="text-[11px] text-dime-ink-3">{restaurant?.city}</Text>
            </View>
            <ScrollView>
              {nav.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Pressable
                    key={n.href}
                    onPress={() => { haptic.light(); router.push(n.href as never); }}
                    className={cn("mb-1 flex-row items-center gap-3 rounded-xl px-3 py-2.5", active ? "bg-dime-orange-50" : "bg-transparent")}
                  >
                    <Icon name={n.icon} size={16} color={active ? "#FC8019" : "#8E8E93"} />
                    <Text className={cn("text-[14px]", active ? "font-semibold text-dime-orange-700" : "text-dime-ink-2")}>{n.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
        <View className="flex-1">
          <Slot />
          {!wideScreen ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="border-t border-dime-border bg-white"
              contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
            >
              {nav.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Pressable
                    key={n.href}
                    onPress={() => { haptic.light(); router.push(n.href as never); }}
                    className={cn("flex-row items-center gap-1 rounded-full px-3 py-2", active ? "bg-dime-orange-50" : "bg-transparent")}
                  >
                    <Icon name={n.icon} size={14} color={active ? "#FC8019" : "#8E8E93"} />
                    <Text className={cn("text-[12px]", active ? "font-semibold text-dime-orange-700" : "text-dime-ink-2")}>{n.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
