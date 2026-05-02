import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";

type TabRoute = { name: "home" | "discover" | "bookings" | "profile"; label: string; icon: string };
const tabs: TabRoute[] = [
  { name: "home", label: "Home", icon: "house.fill" },
  { name: "discover", label: "Search", icon: "magnifyingglass" },
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
          className="flex-row items-center justify-around bg-white px-2 pt-2"
          style={{
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopWidth: 1,
            borderTopColor: "#F0F0F0",
          }}
        >
          {tabs.map((t, i) => {
            const focused = state.index === i;
            return (
              <Pressable
                key={t.name}
                onPress={() => { haptic.light(); navigation.navigate(t.name as never); }}
                className="flex-1 items-center py-1"
              >
                <Icon name={t.icon} size={22} color={focused ? "#E23744" : "#93959F"} />
                <Text
                  className="mt-1 text-[10px] font-semibold"
                  style={{ color: focused ? "#E23744" : "#93959F", letterSpacing: 0.1 }}
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
