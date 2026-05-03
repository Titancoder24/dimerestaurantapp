import { useEffect, useRef, useState } from "react";
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

type Section = "dineout" | "rms" | "workspace";
type NavItem = {
  href: string; label: string; icon: string;
  section: Section; group: string;
  ownerOnly?: boolean;
};
const nav: NavItem[] = [
  // ── DINEOUT (everything tied to the diner-facing DIME app) ────────
  { href: "/owner/dashboard", label: "Dashboard", icon: "chart.line.uptrend.xyaxis", section: "dineout", group: "Operations" },
  { href: "/owner/kitchen", label: "Kitchen (KDS)", icon: "flame.fill", section: "dineout", group: "Operations" },
  { href: "/owner/orders", label: "Orders", icon: "bag.fill", section: "dineout", group: "Operations" },
  { href: "/owner/tables", label: "Tables", icon: "tablecells", section: "dineout", group: "Operations" },
  { href: "/owner/floor-plan", label: "Floor plan", icon: "rectangle.split.3x1.fill", section: "dineout", group: "Operations" },

  { href: "/owner/dineout", label: "Dineout content", icon: "sparkles", section: "dineout", group: "Listing" },
  { href: "/owner/bookings", label: "Bookings", icon: "calendar", section: "dineout", group: "Reservations" },
  { href: "/owner/waitlist", label: "Walk-in waitlist", icon: "person.3.fill", section: "dineout", group: "Reservations" },
  { href: "/owner/reviews", label: "Diner reviews", icon: "star.fill", section: "dineout", group: "Reputation" },

  { href: "/owner/loyalty", label: "Loyalty program", icon: "sparkles", section: "dineout", group: "Programs" },
  { href: "/owner/offers", label: "Promo codes", icon: "gift.fill", section: "dineout", group: "Programs" },
  { href: "/owner/ads", label: "Promoted ads", icon: "megaphone.fill", section: "dineout", group: "Programs" },

  { href: "/owner/messages", label: "Messages", icon: "text.bubble.fill", section: "dineout", group: "Inbox" },
  { href: "/owner/notifications", label: "Notifications", icon: "bell.fill", section: "dineout", group: "Inbox" },

  // ── RESTAURANT MANAGEMENT (back-office only) ──────────────────────
  { href: "/owner/menu", label: "Menu", icon: "fork.knife", section: "rms", group: "Menu" },
  { href: "/owner/menu-designer", label: "Menu Creator", icon: "photo.fill", section: "rms", group: "Menu" },
  { href: "/owner/86-list", label: "86-list & specials", icon: "xmark.circle", section: "rms", group: "Menu" },
  { href: "/owner/recipes", label: "Recipes & food cost", icon: "scale.3d", section: "rms", group: "Menu" },

  { href: "/owner/inventory", label: "Inventory", icon: "shippingbox.fill", section: "rms", group: "Supply" },
  { href: "/owner/vendors", label: "Vendors & POs", icon: "truck.box.fill", section: "rms", group: "Supply" },
  { href: "/owner/wastage", label: "Wastage log", icon: "trash.fill", section: "rms", group: "Supply" },
  { href: "/owner/equipment", label: "Equipment", icon: "shippingbox.fill", section: "rms", group: "Supply" },

  { href: "/owner/staff", label: "Staff & roles", icon: "person.2.fill", section: "rms", group: "People", ownerOnly: true },
  { href: "/owner/shifts", label: "Shifts & clock", icon: "clock.fill", section: "rms", group: "People" },
  { href: "/owner/tips", label: "Tip pool", icon: "banknote.fill", section: "rms", group: "People" },
  { href: "/owner/customers", label: "Customer CRM", icon: "person.fill", section: "rms", group: "People" },

  { href: "/owner/analytics", label: "Analytics", icon: "chart.bar.fill", section: "rms", group: "Finance" },
  { href: "/owner/expenses", label: "Expenses & P&L", icon: "chart.line.uptrend.xyaxis", section: "rms", group: "Finance" },
  { href: "/owner/cash-recon", label: "Cash recon", icon: "indianrupeesign.circle.fill", section: "rms", group: "Finance" },
  { href: "/owner/delivery-recon", label: "Delivery payouts", icon: "globe", section: "rms", group: "Finance" },

  { href: "/owner/banquets", label: "Private events", icon: "calendar.badge.checkmark", section: "rms", group: "Programs" },
  { href: "/owner/compliance", label: "Compliance", icon: "checkmark.seal.fill", section: "rms", group: "Programs" },

  // ── WORKSPACE (account-level) ─────────────────────────────────────
  { href: "/owner/help", label: "Help", icon: "info.circle", section: "workspace", group: "Account" },
  { href: "/owner/settings", label: "Settings", icon: "gear", section: "workspace", group: "Account", ownerOnly: true },
];

const ownerPrimaryTabs = ["/owner/dashboard", "/owner/kitchen", "/owner/orders", "/owner/tables"];
const sectionMeta: Record<Section, { label: string; sub: string; dot: string; icon: string }> = {
  dineout: { label: "DIME · DINER APP", sub: "Live ops, listing, bookings, chat, programs", dot: "#FF5A1F", icon: "sparkles" },
  rms: { label: "RESTAURANT MANAGEMENT", sub: "Back-office: menu, supply, people, finance", dot: "#6F5BFF", icon: "rectangle.split.3x1.fill" },
  workspace: { label: "WORKSPACE", sub: "Account & support", dot: "#0F8A4F", icon: "gear" },
};
const sectionOrder: Section[] = ["dineout", "rms", "workspace"];
const groupOrderInSection: Record<Section, string[]> = {
  dineout: ["Operations", "Listing", "Reservations", "Reputation", "Programs", "Inbox"],
  rms: ["Menu", "Supply", "People", "Finance", "Programs"],
  workspace: ["Account"],
};

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

  // Auth pages live at /owner/signup and /owner/login — they must bypass
  // the auth gate that protects the rest of the owner workspace.
  const isAuthRoute = pathname === "/owner/signup" || pathname === "/owner/login";

  useEffect(() => {
    if (isAuthRoute || !hydrated || redirected.current) return;
    if (!session) {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/owner/login"));
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
  }, [hydrated, session, profile, restaurantLoading, restaurant, pathname, router, isAuthRoute]);

  if (isAuthRoute) {
    return <Slot />;
  }
  if (!hydrated || !session || !profile) return null;
  if (profile.role !== "owner" && profile.role !== "manager" && profile.role !== "super_admin") return null;

  const isManager = profile?.role === "manager";
  const visibleNav = isManager ? nav.filter((n) => !n.ownerOnly) : nav;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("dime:owner:nav") === "rail"; } catch { return false; }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem("dime:owner:nav", collapsed ? "rail" : "expanded"); } catch {}
  }, [collapsed]);

  // Two-level nav: section -> group -> items
  const sectioned: Record<Section, Record<string, NavItem[]>> = {
    dineout: {}, rms: {}, workspace: {},
  };
  for (const n of visibleNav) {
    sectioned[n.section][n.group] = sectioned[n.section][n.group] ?? [];
    sectioned[n.section][n.group]!.push(n);
  }

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out? You can sign back in anytime.")) return;
    }
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1" style={{ backgroundColor: "#FAFAFA" }}>
      <View className="flex-1 flex-row">
        {wideScreen ? (
          <View
            style={{
              width: collapsed ? 60 : 244,
              backgroundColor: "#FFFFFF",
              borderRightWidth: 1,
              borderRightColor: "#ECECEC",
            }}
          >
            {/* Workspace switcher + toggle */}
            {collapsed ? (
              <View style={{ paddingHorizontal: 8, paddingTop: 14, paddingBottom: 8, alignItems: "center", gap: 8 }}>
                <Pressable
                  onPress={() => router.push("/owner/dashboard" as never)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: "#0E0E0C",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFB088", fontSize: 15, fontWeight: "800", letterSpacing: -0.4 }}>D</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCollapsed((c: boolean) => !c)}
                  style={{
                    width: 36, height: 32, borderRadius: 6,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: "#F5F5F4",
                  }}
                >
                  <Icon name="sidebar.right" size={14} color="#737373" />
                </Pressable>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Pressable
                    onPress={() => router.push("/owner/dashboard" as never)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8,
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        backgroundColor: "#0E0E0C",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#FFB088", fontSize: 13, fontWeight: "800", letterSpacing: -0.4 }}>D</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: "#0E0E0C", letterSpacing: -0.2 }}>
                        {restaurant?.name ?? "DIME Workspace"}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: "#8B8780", marginTop: 1, letterSpacing: 0.1 }}>
                        {isManager ? "Manager" : restaurant?.city ?? "Owner"}
                      </Text>
                    </View>
                    <Icon name="chevron.up.chevron.down" size={11} color="#A1A09A" />
                  </Pressable>
                  <Pressable
                    onPress={() => setCollapsed((c: boolean) => !c)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: "#F5F5F4",
                    }}
                  >
                    <Icon name="sidebar.left" size={13} color="#737373" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Search bar — hidden when collapsed */}
            {!collapsed ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                <View
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    height: 32, paddingHorizontal: 10, borderRadius: 7,
                    backgroundColor: "#F5F5F4",
                    borderWidth: 1, borderColor: "#ECECEC",
                  }}
                >
                  <Icon name="magnifyingglass" size={12} color="#A1A09A" />
                  <Text style={{ flex: 1, fontSize: 12, color: "#8B8780" }}>Search</Text>
                  <View
                    style={{
                      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                      backgroundColor: "#fff",
                      borderWidth: 1, borderColor: "#E8E8E8",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#8B8780", fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>⌘K</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Nav: sections > groups > items */}
            <ScrollView style={{ flex: 1, paddingHorizontal: collapsed ? 4 : 8 }} showsVerticalScrollIndicator={false}>
              {sectionOrder.map((sec) => {
                const groups = sectioned[sec];
                if (!groups || Object.keys(groups).length === 0) return null;
                const meta = sectionMeta[sec];
                return (
                  <View key={sec} style={{ marginBottom: 18 }}>
                    {/* Section header */}
                    {!collapsed ? (
                      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.dot }} />
                          <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#0E0E0C", letterSpacing: 1.4, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                            {meta.label}
                          </Text>
                        </View>
                        <Text style={{ marginTop: 2, fontSize: 10.5, color: "#8B8780", letterSpacing: 0.1 }}>
                          {meta.sub}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ alignSelf: "center", marginVertical: 6 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.dot }} />
                      </View>
                    )}

                    {/* Sub-groups within this section */}
                    {groupOrderInSection[sec].filter((g) => groups[g]).map((g) => (
                      <View key={`${sec}-${g}`} style={{ marginBottom: 6, paddingHorizontal: collapsed ? 0 : 6 }}>
                        {!collapsed ? (
                          <Text
                            style={{
                              paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4,
                              fontSize: 10, fontWeight: "600", color: "#A1A09A",
                              letterSpacing: 0.6, textTransform: "uppercase",
                            }}
                          >
                            {g}
                          </Text>
                        ) : (
                          <View style={{ marginVertical: 3, alignSelf: "center", width: 14, height: 1, backgroundColor: "#ECECEC" }} />
                        )}
                        {groups[g]!.map((n) => {
                          const active = pathname.startsWith(n.href);
                          const isNotif = n.href.includes("notifications");
                          return (
                            <Pressable
                              key={n.href}
                              onPress={() => { haptic.light(); router.push(n.href as never); }}
                              style={{
                                marginBottom: 1,
                                flexDirection: "row", alignItems: "center", gap: 9,
                                paddingHorizontal: collapsed ? 0 : 8,
                                paddingVertical: collapsed ? 8 : 6,
                                borderRadius: 6,
                                backgroundColor: active ? "#F5F5F4" : "transparent",
                                justifyContent: collapsed ? "center" : "flex-start",
                                marginHorizontal: collapsed ? 4 : 0,
                              }}
                            >
                              <Icon
                                name={n.icon}
                                size={collapsed ? 16 : 14}
                                color={active ? "#0E0E0C" : "#737373"}
                              />
                              {!collapsed ? (
                                <Text
                                  style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontWeight: active ? "600" : "500",
                                    color: active ? "#0E0E0C" : "#3F3D38",
                                    letterSpacing: -0.1,
                                  }}
                                >
                                  {n.label}
                                </Text>
                              ) : null}
                              {!collapsed && isNotif && (unreadCount ?? 0) > 0 ? (
                                <View
                                  style={{
                                    minWidth: 18, height: 16, paddingHorizontal: 4,
                                    borderRadius: 4, backgroundColor: "#6F5BFF",
                                    alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10, fontWeight: "700", color: "#fff",
                                      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                                    }}
                                  >
                                    {unreadCount! > 9 ? "9+" : unreadCount}
                                  </Text>
                                </View>
                              ) : !collapsed && active ? (
                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: meta.dot }} />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                );
              })}
              <View style={{ height: 12 }} />
            </ScrollView>

            {/* User card / sign out */}
            <View style={{ borderTopWidth: 1, borderTopColor: "#ECECEC", padding: 10 }}>
              {collapsed ? (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <Pressable onPress={() => router.push("/owner/settings" as never)}>
                    <Avatar name={profile.name} uri={profile.avatar_url} size={32} />
                  </Pressable>
                  <Pressable
                    onPress={handleSignOut}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: "#F5F5F4",
                    }}
                  >
                    <Icon name="arrow.right" size={13} color="#737373" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => router.push("/owner/settings" as never)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    paddingHorizontal: 8, paddingVertical: 8, borderRadius: 7,
                  }}
                >
                  <Avatar name={profile.name} uri={profile.avatar_url} size={28} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: "600", color: "#0E0E0C", letterSpacing: -0.1 }}>
                      {profile.name ?? "Owner"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <View
                        style={{
                          width: 5, height: 5, borderRadius: 2.5,
                          backgroundColor: isManager ? "#3358D4" : "#0F8A4F",
                        }}
                      />
                      <Text style={{ fontSize: 10, color: "#8B8780", letterSpacing: 0.2 }}>
                        {isManager ? "Manager" : "Owner"}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={handleSignOut}
                    hitSlop={8}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="arrow.right" size={12} color="#A1A09A" />
                  </Pressable>
                </Pressable>
              )}
            </View>
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
