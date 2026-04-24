import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Header, Icon, ListItem, ListSection, Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { rupees } from "@/lib/format";

export default function Profile() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);

  const tier = profile?.loyalty_tier ?? "silver";
  const tierColor = {
    silver: "bg-gray-100 text-gray-700",
    gold: "bg-amber-50 text-amber-700",
    platinum: "bg-slate-100 text-slate-700",
    diamond: "bg-cyan-50 text-cyan-700",
  }[tier];

  return (
    <Screen>
      <Header title="Profile" />

      <View className="mx-4 overflow-hidden rounded-2xl bg-dime-ink" style={{ backgroundColor: "#1C1C1E" }}>
        <View className="p-5">
          <View className="flex-row items-center gap-3">
            <Avatar name={profile?.name} uri={profile?.avatar_url} size={56} />
            <View className="flex-1">
              <Text className="text-[18px] font-semibold text-white">{profile?.name ?? "Guest"}</Text>
              <Text className="text-[13px] text-white/60">{profile?.email}</Text>
              <View className={`mt-1.5 self-start rounded-full px-2 py-0.5 ${tierColor.split(" ")[0]}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${tierColor.split(" ")[1]}`}>
                  {tier} member
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row justify-around border-t border-white/10 pt-4">
            <Stat label="Loyalty" value={String(profile?.loyalty_points ?? 0)} />
            <Stat label="Saved" value={rupees(0)} />
            <Stat label="Tier" value={tier[0]?.toUpperCase() + tier.slice(1)} />
          </View>
        </View>
      </View>

      <ListSection>
        <ListItem title="Edit Profile" leading={<Icon name="pencil" size={18} color="#FC8019" />} onPress={() => router.push("/edit-profile")} />
        <ListItem title="Food Preferences" leading={<Icon name="leaf.fill" size={18} color="#FC8019" />} onPress={() => router.push("/preferences")} />
        <ListItem title="Loyalty & Rewards" leading={<Icon name="crown.fill" size={18} color="#FC8019" />} onPress={() => router.push("/loyalty")} />
        <ListItem title="Offers" leading={<Icon name="gift.fill" size={18} color="#FC8019" />} onPress={() => router.push("/offers")} />
      </ListSection>

      <ListSection title="Activity">
        <ListItem title="My Orders" leading={<Icon name="bag.fill" size={18} color="#FC8019" />} onPress={() => router.push("/orders")} />
        <ListItem title="My Bookings" leading={<Icon name="calendar" size={18} color="#FC8019" />} onPress={() => router.push("/bookings")} />
        <ListItem title="My Reviews" leading={<Icon name="star.fill" size={18} color="#FC8019" />} onPress={() => router.push("/my-reviews")} />
        <ListItem title="Favorites" leading={<Icon name="heart.fill" size={18} color="#FC8019" />} onPress={() => router.push("/favorites")} />
      </ListSection>

      <ListSection title="Account">
        <ListItem title="Refer & Earn" subtitle={profile?.referral_code ?? ""} leading={<Icon name="sparkles" size={18} color="#FC8019" />} onPress={() => router.push("/refer")} />
        <ListItem title="Help & Support" leading={<Icon name="info.circle" size={18} color="#FC8019" />} onPress={() => router.push("/support")} />
        <ListItem title="Notifications" leading={<Icon name="bell.fill" size={18} color="#FC8019" />} onPress={() => router.push("/notifications")} />
      </ListSection>

      <ListSection>
        <ListItem
          title="Sign out"
          destructive
          leading={<Icon name="arrow.right" size={18} color="#EF4444" />}
          chevron={false}
          onPress={() => {
            Alert.alert("Sign out?", "You can sign back in anytime.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: async () => {
                  await signOut();
                  router.replace("/login");
                },
              },
            ]);
          }}
        />
      </ListSection>

      <View className="mt-8 items-center pb-6">
        <Text className="text-[11px] text-dime-ink-3">DIME • Made in Bengaluru</Text>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-[20px] font-semibold text-white">{value}</Text>
      <Text className="text-[11px] uppercase tracking-widest text-white/60">{label}</Text>
    </View>
  );
}
