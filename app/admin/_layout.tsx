import { useEffect, useRef } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: string; group: string; permission?: string };
const nav: NavItem[] = [
  // Operations
  { href: "/admin/dashboard", label: "Dashboard", icon: "chart.bar.fill", group: "Operations" },
  { href: "/admin/live", label: "Mission Control", icon: "flame.fill", group: "Operations" },
  { href: "/admin/orders", label: "Orders", icon: "bag.fill", group: "Operations" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar", group: "Operations" },
  // Growth
  { href: "/admin/financials", label: "Financials", icon: "chart.line.uptrend.xyaxis", group: "Growth", permission: "view_revenue" },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: "crown.fill", group: "Growth" },
  { href: "/admin/cohorts", label: "Cohorts", icon: "person.fill", group: "Growth", permission: "view_cohorts" },
  { href: "/admin/risk", label: "Risk & Fraud", icon: "exclamationmark.triangle.fill", group: "Growth", permission: "view_risk" },
  // Platform
  { href: "/admin/restaurants", label: "Restaurants", icon: "building.2.fill", group: "Platform", permission: "manage_restaurants" },
  { href: "/admin/users", label: "Customers", icon: "person.fill", group: "Platform", permission: "manage_users" },
  { href: "/admin/support", label: "Support", icon: "tray.fill", group: "Platform" },
  // Marketing & Engineering
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

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-dime-bg-grouped">
      <View className="flex-1 flex-row">
        {wide ? (
          <View className="w-[240px] border-r border-neutral-50 bg-white px-3 py-5">
            <View className="mb-4 px-2">
              <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>DIME Admin</Text>
              <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{profile.name ?? "Console"}</Text>
              {profile.admin_role ? (
                <View className="mt-1 self-start rounded-full bg-dime-primary-50 px-2 py-0.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-dime-primary-700">{profile.admin_role}</Text>
                </View>
              ) : null}
            </View>
            <ScrollView>
              {groupOrder.filter((g) => grouped[g]).map((g) => (
                <View key={g} className="mb-4">
                  <Text className="mb-1 px-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{g}</Text>
                  {grouped[g]!.map((n) => {
                    const active = pathname.startsWith(n.href);
                    return (
                      <Pressable
                        key={n.href}
                        onPress={() => { haptic.light(); router.push(n.href as never); }}
                        className={cn("mb-0.5 flex-row items-center gap-4 rounded-xl px-3 py-2", active ? "bg-dime-primary-50" : "bg-transparent")}
                      >
                        <Icon name={n.icon} size={14} color={active ? "#FF6B2C" : "#8A8A8A"} />
                        <Text className={cn("text-[13px]", active ? "font-bold text-dime-primary-700" : "text-dime-ink-2")}>{n.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
        <View className="flex-1">
          <Slot />
          {!wide ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="border-t border-neutral-50 bg-white"
              contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
            >
              {visibleNav.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Pressable
                    key={n.href}
                    onPress={() => router.push(n.href as never)}
                    className={cn("flex-row items-center gap-1 rounded-full px-3 py-2", active ? "bg-dime-primary-50" : "bg-transparent")}
                  >
                    <Icon name={n.icon} size={14} color={active ? "#FF6B2C" : "#8A8A8A"} />
                    <Text className={cn("text-[12px]", active ? "font-bold text-dime-primary-700" : "text-dime-ink-2")}>{n.label}</Text>
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
