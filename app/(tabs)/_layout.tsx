import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";
import { cn } from "@/lib/cn";

type TabRoute = { name: "home" | "discover" | "bookings" | "profile"; label: string; icon: string };
const tabs: TabRoute[] = [
  { name: "home", label: "Home", icon: "house.fill" },
  { name: "discover", label: "Discover", icon: "magnifyingglass" },
  { name: "bookings", label: "Bookings", icon: "calendar" },
  { name: "profile", label: "Profile", icon: "person.fill" },
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
            paddingBottom: Math.max(insets.bottom, 12),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
            elevation: 8,
            borderTopWidth: 0,
          }}
        >
          {tabs.map((t, i) => {
            const focused = state.index === i;
            return (
              <Pressable
                key={t.name}
                onPress={() => {
                  haptic.light();
                  navigation.navigate(t.name as never);
                }}
                className="flex-1 items-center"
              >
                <View className={cn(
                  "h-8 w-14 items-center justify-center rounded-full",
                  focused && "bg-dime-primary-50"
                )}>
                  <Icon name={t.icon} size={20} color={focused ? "#FF6B2C" : "#BFBFBF"} />
                </View>
                <Text
                  className={cn(
                    "mt-0.5 text-[10px]",
                    focused ? "font-bold text-dime-primary-600" : "font-medium text-dime-ink-4"
                  )}
                  style={{ letterSpacing: 0.2 }}
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
