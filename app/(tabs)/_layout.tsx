import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";
import { T } from "@/lib/visual";

type TabRoute = { name: "home" | "discover" | "bookings" | "profile"; label: string; icon: string };
const tabs: TabRoute[] = [
  { name: "home", label: "Home", icon: "house.fill" },
  { name: "discover", label: "Discover", icon: "magnifyingglass" },
  { name: "bookings", label: "Bookings", icon: "calendar" },
  { name: "profile", label: "Account", icon: "person.fill" },
];

export default function CustomerTabs() {
  const router = useRouter();
  const hydrated = useAuth((s) => s.hydrated);
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const useTopNavOnly = Platform.OS === "web" && width >= 900;
  const redirected = useRef(false);

  useEffect(() => {
    if (!hydrated || redirected.current) return;
    if (!session) {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/login"));
      return;
    }
    if (!profile) return;
    if (profile.role === "super_admin") {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/admin/dashboard"));
    } else if (profile.role === "owner" || profile.role === "manager") {
      redirected.current = true;
      requestAnimationFrame(() => router.replace("/owner/dashboard"));
    }
  }, [hydrated, session, profile, router]);

  if (!hydrated || !session || !profile) return null;
  if (profile.role === "super_admin" || profile.role === "owner" || profile.role === "manager") return null;

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={useTopNavOnly ? () => null : ({ state, navigation }) => (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            backgroundColor: T.card,
            paddingTop: 10,
            paddingHorizontal: 14,
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopWidth: 1,
            borderTopColor: T.hairline,
          }}
        >
          {tabs.map((t, i) => {
            const focused = state.index === i;
            return (
              <Pressable
                key={t.name}
                onPress={() => { haptic.light(); navigation.navigate(t.name as never); }}
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: focused ? T.cream : "transparent",
                }}
              >
                <Icon name={t.icon} size={focused ? 22 : 21} color={focused ? T.ink : T.muted} />
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: focused ? "700" : "500",
                    letterSpacing: 0.1,
                    color: focused ? T.ink : T.muted,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      {tabs.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}
