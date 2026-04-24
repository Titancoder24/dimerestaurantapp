import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { Icon, haptic } from "@/components/ui";
import { cn } from "@/lib/cn";

const nav: { href: string; label: string; icon: string }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "chart.bar.fill" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "building.2.fill" },
  { href: "/admin/users", label: "Users", icon: "person.fill" },
  { href: "/admin/orders", label: "Orders", icon: "bag.fill" },
  { href: "/admin/support", label: "Support", icon: "tray.fill" },
  { href: "/admin/content", label: "Content", icon: "photo.fill" },
];

export default function AdminLayout() {
  const profile = useAuth((s) => s.profile);
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  if (!profile) return <Redirect href="/login" />;
  if (profile.role !== "super_admin") return <Redirect href="/" />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-dime-bg-grouped">
      <View className="flex-1 flex-row">
        {wide ? (
          <View className="w-[220px] border-r border-dime-border bg-white px-3 py-4">
            <View className="mb-4 px-2">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">DIME Admin</Text>
              <Text className="text-[15px] font-semibold text-dime-ink">Platform Console</Text>
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
          {!wide ? (
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
                    onPress={() => router.push(n.href as never)}
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
