import { Redirect, Tabs } from "expo-router";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
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
  const session = useAuth((s) => s.session);
  const { width } = useWindowDimensions();
  // On web at desktop sizes, the CustomerWebShell renders the top nav,
  // so we hide the bottom tab bar entirely.
  const useTopNavOnly = Platform.OS === "web" && width >= 900;

  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={useTopNavOnly ? () => null : ({ state, navigation }) => (
        <View className="flex-row items-center justify-around border-t border-dime-border bg-white/95 px-3 pb-6 pt-2">
          {tabs.map((t, i) => {
            const focused = state.index === i;
            return (
              <Pressable
                key={t.name}
                onPress={() => {
                  haptic.light();
                  navigation.navigate(t.name as never);
                }}
                className="items-center"
              >
                <View className={cn("flex-row items-center gap-1.5 rounded-full px-3 py-2", focused && "bg-dime-orange-50")}>
                  <Icon name={t.icon} size={20} color={focused ? "#FC8019" : "#8E8E93"} />
                  {focused ? (
                    <Text className="text-[12px] font-semibold text-dime-orange-600">{t.label}</Text>
                  ) : null}
                </View>
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
