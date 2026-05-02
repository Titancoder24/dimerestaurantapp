import { useEffect, useRef } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import { Platform, Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Avatar, Icon, haptic } from "@/components/ui";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: string; group: string; permission?: string };
const nav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "chart.bar.fill", group: "Operations" },
  { href: "/admin/live", label: "Mission Control", icon: "flame.fill", group: "Operations" },
  { href: "/admin/orders", label: "Orders", icon: "bag.fill", group: "Operations" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar", group: "Operations" },
  { href: "/admin/financials", label: "Financials", icon: "chart.line.uptrend.xyaxis", group: "Growth", permission: "view_revenue" },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: "crown.fill", group: "Growth" },
  { href: "/admin/cohorts", label: "Cohorts", icon: "person.fill", group: "Growth", permission: "view_cohorts" },
  { href: "/admin/risk", label: "Risk & Fraud", icon: "exclamationmark.triangle.fill", group: "Growth", permission: "view_risk" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "building.2.fill", group: "Platform", permission: "manage_restaurants" },
  { href: "/admin/dineout", label: "Dineout content", icon: "fork.knife", group: "Platform", permission: "manage_restaurants" },
  { href: "/admin/users", label: "Customers", icon: "person.fill", group: "Platform", permission: "manage_users" },
  { href: "/admin/support", label: "Support", icon: "tray.fill", group: "Platform" },
  { href: "/admin/ads", label: "Ads pipeline", icon: "sparkles", group: "Marketing", permission: "manage_campaigns" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "gift.fill", group: "Marketing", permission: "manage_campaigns" },
  { href: "/admin/content", label: "Content", icon: "photo.fill", group: "Marketing", permission: "manage_content" },
  { href: "/admin/flags", label: "Feature Flags", icon: "sparkles", group: "Engineering", permission: "manage_flags" },
  { href: "/admin/audit", label: "Audit Log", icon: "doc.text.fill", group: "Engineering", permission: "view_audit" },
  { href: "/admin/team", label: "Team & Roles", icon: "person.fill", group: "Settings", permission: "manage_team" },
];

export default function AdminLayout() {
  const router = useRouter();
  const hydrated = useAuth((s) => s.hydrated);
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const redirected = useRef(false);

  useEffect(() => {
    if (!hydrated || redirected.current) return;
    if (!session) {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/login"));
      return;
    }
    if (!profile) return;
    if (profile.role !== "super_admin") {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/"));
    }
  }, [hydrated, session, profile, router]);

  if (!hydrated || !session || !profile) return null;
  if (profile.role !== "super_admin") return null;

  const perms = profile.admin_permissions ?? {};
  const isSuper = profile.admin_role === "super" || !profile.admin_role;

  const visibleNav = nav.filter((n) => !n.permission || isSuper || perms[n.permission]);
  const grouped: Record<string, NavItem[]> = {};
  for (const n of visibleNav) {
    grouped[n.group] = grouped[n.group] ?? [];
    grouped[n.group]!.push(n);
  }
  const groupOrder = ["Operations", "Growth", "Platform", "Marketing", "Engineering", "Settings"];

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out of admin console?")) return;
    }
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-50">
      <View className="flex-1 flex-row">
        {wide ? (
          <View className="w-[260px] bg-[#0F0F0F]" style={{ shadowColor: "#000", shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.08, shadowRadius: 24 }}>
            {/* Brand header */}
            <View className="px-5 pb-4 pt-6">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-primary-500">
                  <Text className="text-[16px] font-bold text-white">D</Text>
                </View>
                <View>
                  <Text className="text-[15px] font-bold text-white" style={{ letterSpacing: -0.3 }}>DIME Admin</Text>
                  <Text className="text-[11px] text-neutral-500">Console</Text>
                </View>
              </View>
            </View>

            <View className="mx-5 mb-4 h-px bg-white/[0.06]" />

            {/* Profile */}
            <View className="mx-5 mb-5 flex-row items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5">
              <Avatar name={profile.name} uri={profile.avatar_url} size={32} />
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-white" numberOfLines={1}>{profile.name ?? "Admin"}</Text>
                {profile.admin_role ? (
                  <Text className="text-[10px] font-bold uppercase text-dime-primary-400" style={{ letterSpacing: 0.8 }}>{profile.admin_role}</Text>
                ) : null}
              </View>
            </View>

            {/* Nav groups */}
            <ScrollView className="flex-1 px-3" showsVerticalScrollIndicator={false}>
              {groupOrder.filter((g) => grouped[g]).map((g) => (
                <View key={g} className="mb-5">
                  <Text className="mb-1.5 px-3 text-[10px] font-bold uppercase text-neutral-500" style={{ letterSpacing: 1.2 }}>{g}</Text>
                  {grouped[g]!.map((n) => {
                    const active = pathname.startsWith(n.href);
                    return (
                      <Pressable
                        key={n.href}
                        onPress={() => { haptic.light(); router.push(n.href as never); }}
                        className={cn("mb-0.5 flex-row items-center gap-3 rounded-lg px-3 py-2", active ? "bg-white/[0.1]" : "bg-transparent")}
                      >
                        <View className={cn("h-7 w-7 items-center justify-center rounded-lg", active ? "bg-dime-primary-500" : "bg-white/[0.06]")}>
                          <Icon name={n.icon} size={13} color={active ? "#fff" : "#737373"} />
                        </View>
                        <Text className={cn("text-[13px]", active ? "font-semibold text-white" : "text-neutral-400")}>{n.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <View className="h-4" />
            </ScrollView>

            {/* Sign out */}
            <View className="mx-5 mb-2 h-px bg-white/[0.06]" />
            <Pressable
              onPress={handleSignOut}
              className="mx-3 mb-5 flex-row items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                <Icon name="arrow.right" size={13} color="#EF4444" />
              </View>
              <Text className="text-[13px] font-medium text-red-400">Sign out</Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-1">
          <Slot />
          {!wide ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="border-t border-neutral-100 bg-white"
              contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
            >
              {visibleNav.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Pressable
                    key={n.href}
                    onPress={() => router.push(n.href as never)}
                    className={cn("flex-row items-center gap-1.5 rounded-full px-3 py-2", active ? "bg-dime-ink" : "bg-transparent")}
                  >
                    <Icon name={n.icon} size={13} color={active ? "#fff" : "#8A8A8A"} />
                    <Text className={cn("text-[12px]", active ? "font-bold text-white" : "text-dime-ink-3")}>{n.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={handleSignOut}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
              >
                <Icon name="arrow.right" size={13} color="#EF4444" />
                <Text className="text-[12px] font-medium text-red-500">Sign out</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
