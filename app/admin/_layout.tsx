import { useEffect, useRef, useState } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import { Platform, Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Avatar, Icon, haptic } from "@/components/ui";

// ── Solid dark palette — no translucent layers ─────────────────────
const A_BG = "#0A0A0A";
const A_PANEL = "#0F0F0F";
const A_PANEL2 = "#141414";
const A_HOVER = "#181818";
const A_ACTIVE = "#1F1F1F";
const A_HAIRLINE = "#1F1F1F";
const A_INK = "#FFFFFF";
const A_INK2 = "#A3A3A3";
const A_INK3 = "#737373";
const A_ACCENT = "#FF5A1F";
const A_MONO = '"IBM Plex Mono", ui-monospace, monospace';

type Section = "platform" | "operations" | "growth" | "marketing" | "system";
type NavItem = { href: string; label: string; icon: string; section: Section; group: string; permission?: string };

const nav: NavItem[] = [
  // Platform — super-admin oversight
  { href: "/admin/restaurants", label: "Restaurants", icon: "building.2.fill", section: "platform", group: "Tenants", permission: "manage_restaurants" },
  { href: "/admin/dineout", label: "Dineout content", icon: "fork.knife", section: "platform", group: "Tenants", permission: "manage_restaurants" },
  { href: "/admin/users", label: "Customers", icon: "person.fill", section: "platform", group: "People", permission: "manage_users" },
  { href: "/admin/team", label: "Team & roles", icon: "person.2.fill", section: "platform", group: "People", permission: "manage_team" },
  { href: "/admin/support", label: "Support tickets", icon: "tray.fill", section: "platform", group: "Inbox" },
  { href: "/admin/support-chats", label: "Owner chats", icon: "text.bubble.fill", section: "platform", group: "Inbox" },

  // Operations — live ops
  { href: "/admin/dashboard", label: "Dashboard", icon: "chart.bar.fill", section: "operations", group: "Live" },
  { href: "/admin/live", label: "Mission control", icon: "flame.fill", section: "operations", group: "Live" },
  { href: "/admin/orders", label: "Orders", icon: "bag.fill", section: "operations", group: "Live" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar", section: "operations", group: "Live" },

  // Growth — financial & behavioural
  { href: "/admin/financials", label: "Financials", icon: "chart.line.uptrend.xyaxis", section: "growth", group: "Money", permission: "view_revenue" },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: "crown.fill", section: "growth", group: "Money" },
  { href: "/admin/cohorts", label: "Cohorts", icon: "person.fill", section: "growth", group: "Behaviour", permission: "view_cohorts" },
  { href: "/admin/risk", label: "Risk & fraud", icon: "exclamationmark.triangle.fill", section: "growth", group: "Behaviour", permission: "view_risk" },

  // Marketing
  { href: "/admin/ads", label: "Ads pipeline", icon: "megaphone.fill", section: "marketing", group: "Acquisition", permission: "manage_campaigns" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "gift.fill", section: "marketing", group: "Acquisition", permission: "manage_campaigns" },
  { href: "/admin/content", label: "Editorial content", icon: "photo.fill", section: "marketing", group: "Editorial", permission: "manage_content" },

  // System
  { href: "/admin/flags", label: "Feature flags", icon: "sparkles", section: "system", group: "Engineering", permission: "manage_flags" },
  { href: "/admin/audit", label: "Audit log", icon: "doc.text.fill", section: "system", group: "Engineering", permission: "view_audit" },
];

const sectionMeta: Record<Section, { label: string; sub: string; dot: string }> = {
  platform: { label: "PLATFORM", sub: "Tenants, people & inbox", dot: "#FF5A1F" },
  operations: { label: "OPERATIONS", sub: "Live network ops", dot: "#34D399" },
  growth: { label: "GROWTH", sub: "Money & behaviour", dot: "#6F5BFF" },
  marketing: { label: "MARKETING", sub: "Acquisition & editorial", dot: "#F8B400" },
  system: { label: "SYSTEM", sub: "Engineering kill-switches", dot: "#A3A3A3" },
};
const sectionOrder: Section[] = ["platform", "operations", "growth", "marketing", "system"];
const groupOrderInSection: Record<Section, string[]> = {
  platform: ["Tenants", "People", "Inbox"],
  operations: ["Live"],
  growth: ["Money", "Behaviour"],
  marketing: ["Acquisition", "Editorial"],
  system: ["Engineering"],
};

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

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("dime:admin:nav") === "rail"; } catch { return false; }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem("dime:admin:nav", collapsed ? "rail" : "expanded"); } catch {}
  }, [collapsed]);

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

  const sectioned: Record<Section, Record<string, NavItem[]>> = {
    platform: {}, operations: {}, growth: {}, marketing: {}, system: {},
  };
  for (const n of visibleNav) {
    sectioned[n.section][n.group] = sectioned[n.section][n.group] ?? [];
    sectioned[n.section][n.group]!.push(n);
  }

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out of admin console?")) return;
    }
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: A_BG }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {wide ? (
          <View
            style={{
              width: collapsed ? 60 : 248,
              backgroundColor: A_PANEL,
              borderRightWidth: 1, borderRightColor: A_HAIRLINE,
            }}
          >
            {/* Workspace switcher */}
            {collapsed ? (
              <View style={{ paddingHorizontal: 8, paddingTop: 14, paddingBottom: 8, alignItems: "center", gap: 8 }}>
                <Pressable
                  onPress={() => router.push("/admin/dashboard" as never)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: A_ACCENT, alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: -0.4 }}>D</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCollapsed((c: boolean) => !c)}
                  style={{
                    width: 36, height: 32, borderRadius: 6,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: A_HOVER,
                  }}
                >
                  <Icon name="sidebar.right" size={14} color={A_INK2} />
                </Pressable>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Pressable
                    onPress={() => router.push("/admin/dashboard" as never)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8,
                      flex: 1,
                    }}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: A_ACCENT, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: -0.4 }}>D</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: A_INK, letterSpacing: -0.2 }}>
                        DIME Admin
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: A_ACCENT }} />
                        <Text style={{ fontSize: 10, color: A_INK3, letterSpacing: 0.2, fontFamily: A_MONO }}>
                          SUPER · CONSOLE
                        </Text>
                      </View>
                    </View>
                    <Icon name="chevron.up.chevron.down" size={11} color={A_INK3} />
                  </Pressable>
                  <Pressable
                    onPress={() => setCollapsed((c: boolean) => !c)}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: A_HOVER,
                    }}
                  >
                    <Icon name="sidebar.left" size={13} color={A_INK2} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Search bar */}
            {!collapsed ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                <View
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    height: 32, paddingHorizontal: 10, borderRadius: 7,
                    backgroundColor: A_PANEL2,
                    borderWidth: 1, borderColor: A_HAIRLINE,
                  }}
                >
                  <Icon name="magnifyingglass" size={12} color={A_INK3} />
                  <Text style={{ flex: 1, fontSize: 12, color: A_INK3 }}>Search the platform</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: A_PANEL, borderWidth: 1, borderColor: A_HAIRLINE }}>
                    <Text style={{ fontSize: 10, color: A_INK3, fontFamily: A_MONO }}>⌘K</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Sectioned nav */}
            <ScrollView style={{ flex: 1, paddingHorizontal: collapsed ? 4 : 8 }} showsVerticalScrollIndicator={false}>
              {sectionOrder.map((sec) => {
                const groups = sectioned[sec];
                if (!groups || Object.keys(groups).length === 0) return null;
                const meta = sectionMeta[sec];
                return (
                  <View key={sec} style={{ marginBottom: 18 }}>
                    {!collapsed ? (
                      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.dot }} />
                          <Text style={{ fontSize: 10.5, fontWeight: "800", color: A_INK, letterSpacing: 1.4, fontFamily: A_MONO }}>
                            {meta.label}
                          </Text>
                        </View>
                        <Text style={{ marginTop: 2, fontSize: 10.5, color: A_INK3, letterSpacing: 0.1 }}>
                          {meta.sub}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ alignSelf: "center", marginVertical: 6 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.dot }} />
                      </View>
                    )}

                    {groupOrderInSection[sec].filter((g) => groups[g]).map((g) => (
                      <View key={`${sec}-${g}`} style={{ marginBottom: 6, paddingHorizontal: collapsed ? 0 : 6 }}>
                        {!collapsed ? (
                          <Text style={{ paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4, fontSize: 10, fontWeight: "600", color: A_INK3, letterSpacing: 0.6, textTransform: "uppercase" }}>
                            {g}
                          </Text>
                        ) : (
                          <View style={{ marginVertical: 3, alignSelf: "center", width: 14, height: 1, backgroundColor: A_HAIRLINE }} />
                        )}
                        {groups[g]!.map((n) => {
                          const active = pathname.startsWith(n.href);
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
                                backgroundColor: active ? A_ACTIVE : "transparent",
                                justifyContent: collapsed ? "center" : "flex-start",
                                marginHorizontal: collapsed ? 4 : 0,
                              }}
                            >
                              <Icon name={n.icon} size={collapsed ? 16 : 14} color={active ? A_INK : A_INK2} />
                              {!collapsed ? (
                                <Text style={{ flex: 1, fontSize: 13, fontWeight: active ? "600" : "500", color: active ? A_INK : A_INK2, letterSpacing: -0.1 }}>
                                  {n.label}
                                </Text>
                              ) : null}
                              {!collapsed && active ? (
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
            <View style={{ borderTopWidth: 1, borderTopColor: A_HAIRLINE, padding: 10 }}>
              {collapsed ? (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <Avatar name={profile.name} uri={profile.avatar_url} size={32} />
                  <Pressable
                    onPress={handleSignOut}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: A_HOVER,
                    }}
                  >
                    <Icon name="arrow.right" size={13} color="#F87171" />
                  </Pressable>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    paddingHorizontal: 8, paddingVertical: 8, borderRadius: 7,
                  }}
                >
                  <Avatar name={profile.name} uri={profile.avatar_url} size={28} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: "600", color: A_INK, letterSpacing: -0.1 }}>
                      {profile.name ?? "Admin"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#F87171" }} />
                      <Text style={{ fontSize: 10, color: A_INK3, letterSpacing: 0.4, fontFamily: A_MONO, textTransform: "uppercase" }}>
                        {profile.admin_role ?? "Super admin"}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={handleSignOut}
                    hitSlop={8}
                    style={{ width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: A_HOVER }}
                  >
                    <Icon name="arrow.right" size={12} color="#F87171" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ) : null}
        <View style={{ flex: 1, backgroundColor: A_BG }}>
          <Slot />
          {!wide ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ borderTopWidth: 1, borderTopColor: A_HAIRLINE, backgroundColor: A_PANEL }}
              contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8, gap: 4 }}
            >
              {visibleNav.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Pressable
                    key={n.href}
                    onPress={() => router.push(n.href as never)}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                      backgroundColor: active ? A_ACTIVE : "transparent",
                    }}
                  >
                    <Icon name={n.icon} size={13} color={active ? A_INK : A_INK3} />
                    <Text style={{ fontSize: 12, fontWeight: active ? "700" : "500", color: active ? A_INK : A_INK2 }}>{n.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={handleSignOut}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
              >
                <Icon name="arrow.right" size={13} color="#F87171" />
                <Text style={{ fontSize: 12, fontWeight: "500", color: "#F87171" }}>Sign out</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
