import { Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Icon, Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { haptic } from "@/components/ui/haptics";

const menuItems = [
  { title: "Food Preferences", icon: "leaf.fill", route: "/preferences" },
  { title: "Offers & Promos", icon: "gift.fill", route: "/offers" },
] as const;

const activityItems = [
  { title: "My Orders", icon: "bag.fill", route: "/orders" },
  { title: "My Bookings", icon: "calendar", route: "/bookings" },
  { title: "My Reviews", icon: "star.fill", route: "/my-reviews" },
  { title: "Favorites", icon: "heart.fill", route: "/favorites" },
] as const;

const accountItems = [
  { title: "Help & Support", icon: "questionmark.circle", route: "/support" },
  { title: "Notifications", icon: "bell.fill", route: "/notifications" },
] as const;

export default function Profile() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);

  return (
    <Screen>
      {/* Profile header */}
      <View className="bg-white px-4 pb-5 pt-3">
        <Text className="text-[22px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.5 }}>Account</Text>
        <Pressable
          onPress={() => { haptic.light(); router.push("/edit-profile"); }}
          className="mt-4 flex-row items-center gap-3.5"
        >
          <Avatar name={profile?.name} uri={profile?.avatar_url} size={52} />
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-[#1C1C1E]">{profile?.name ?? "Guest"}</Text>
            <Text className="mt-0.5 text-[13px] text-[#93959F]">{profile?.email}</Text>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2]">
            <Icon name="chevron.right" size={12} color="#93959F" />
          </View>
        </Pressable>
      </View>

      <View className="h-2 bg-[#F2F2F2]" />

      <MenuSection items={menuItems} router={router} />
      <View className="h-2 bg-[#F2F2F2]" />

      <View className="bg-white">
        <Text className="px-4 pb-1 pt-4 text-[11px] font-bold uppercase text-[#93959F]" style={{ letterSpacing: 1 }}>Activity</Text>
      </View>
      <MenuSection items={activityItems} router={router} />
      <View className="h-2 bg-[#F2F2F2]" />

      <View className="bg-white">
        <Text className="px-4 pb-1 pt-4 text-[11px] font-bold uppercase text-[#93959F]" style={{ letterSpacing: 1 }}>Account</Text>
      </View>
      <MenuSection items={accountItems} router={router} />
      <View className="h-2 bg-[#F2F2F2]" />

      {/* Sign out */}
      <Pressable
        onPress={async () => {
          haptic.light();
          if (Platform.OS === "web") {
            if (!window.confirm("Sign out? You can sign back in anytime.")) return;
          }
          await signOut();
          router.replace("/login");
        }}
        className="flex-row items-center gap-3.5 bg-white px-4 py-4"
      >
        <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-[#FFF4F4]">
          <Icon name="arrow.right" size={15} color="#E23744" />
        </View>
        <Text className="text-[15px] font-medium text-[#E23744]">Sign out</Text>
      </Pressable>

      <View className="h-2 bg-[#F2F2F2]" />

      <View className="items-center bg-white py-6">
        <Text className="text-[11px] text-[#93959F]">DIME v1.0 · Made in Bengaluru</Text>
      </View>
    </Screen>
  );
}

function MenuSection({ items, router }: { items: readonly { title: string; icon: string; route: string }[]; router: ReturnType<typeof useRouter> }) {
  return (
    <View className="bg-white">
      {items.map((item, i) => (
        <Pressable
          key={item.route}
          onPress={() => { haptic.light(); router.push(item.route as never); }}
          className="flex-row items-center gap-3.5 px-4 py-3.5"
          style={i > 0 ? { borderTopWidth: 1, borderTopColor: "#F0F0F0" } : undefined}
        >
          <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-[#F8F8F8]">
            <Icon name={item.icon} size={15} color="#535665" />
          </View>
          <Text className="flex-1 text-[15px] font-medium text-[#1C1C1E]">{item.title}</Text>
          <Icon name="chevron.right" size={12} color="#D4D4D8" />
        </Pressable>
      ))}
    </View>
  );
}
