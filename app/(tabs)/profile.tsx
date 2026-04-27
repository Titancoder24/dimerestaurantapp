import { Platform, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Avatar, Icon, ListItem, ListSection, Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { rupees } from "@/lib/format";

export default function Profile() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);

  const tier = profile?.loyalty_tier ?? "silver";
  const tierConfig = {
    silver: { bg: ["#F5F5F5", "#E8E8E8"] as const, text: "text-neutral-600", badge: "bg-neutral-100" },
    gold: { bg: ["#FDF6E3", "#F5E6C4"] as const, text: "text-amber-700", badge: "bg-amber-50" },
    platinum: { bg: ["#F0F0F5", "#DDDDE5"] as const, text: "text-slate-700", badge: "bg-slate-100" },
    diamond: { bg: ["#E8F4F8", "#D0E8F0"] as const, text: "text-cyan-700", badge: "bg-cyan-50" },
  }[tier];

  const iconColor = "#FF6B2C";

  return (
    <Screen>
      <View className="px-5 pb-2 pt-3">
        <Text className="text-[28px] font-bold text-dime-ink" style={{ letterSpacing: -0.8 }}>
          Profile
        </Text>
      </View>

      <View className="mx-5 overflow-hidden rounded-[22px]" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 5 }}>
        <LinearGradient
          colors={["#1A1A1A", "#2D2D2D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6"
        >
          <View className="flex-row items-center gap-4">
            <Avatar name={profile?.name} uri={profile?.avatar_url} size={60} ring />
            <View className="flex-1">
              <Text className="text-[20px] font-bold text-white" style={{ letterSpacing: -0.3 }}>
                {profile?.name ?? "Guest"}
              </Text>
              <Text className="mt-0.5 text-[13px] text-white/50">{profile?.email}</Text>
              <View className="mt-2 self-start rounded-full bg-white/10 px-3 py-1">
                <Text className="text-[10px] font-bold uppercase text-dime-gold-light" style={{ letterSpacing: 1 }}>
                  {tier} member
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6 flex-row justify-around border-t border-white/10 pt-5">
            <Stat label="Points" value={String(profile?.loyalty_points ?? 0)} />
            <View className="w-px bg-white/10" />
            <Stat label="Saved" value={rupees(0)} />
            <View className="w-px bg-white/10" />
            <Stat label="Tier" value={tier[0]?.toUpperCase() + tier.slice(1)} />
          </View>
        </LinearGradient>
      </View>

      <ListSection>
        <ListItem title="Edit Profile" leading={<Icon name="pencil" size={18} color={iconColor} />} onPress={() => router.push("/edit-profile")} />
        <ListItem title="Food Preferences" leading={<Icon name="leaf.fill" size={18} color={iconColor} />} onPress={() => router.push("/preferences")} />
        <ListItem title="Loyalty & Rewards" leading={<Icon name="crown.fill" size={18} color={iconColor} />} onPress={() => router.push("/loyalty")} />
        <ListItem title="Offers" leading={<Icon name="gift.fill" size={18} color={iconColor} />} onPress={() => router.push("/offers")} />
      </ListSection>

      <ListSection title="Activity">
        <ListItem title="My Orders" leading={<Icon name="bag.fill" size={18} color={iconColor} />} onPress={() => router.push("/orders")} />
        <ListItem title="My Bookings" leading={<Icon name="calendar" size={18} color={iconColor} />} onPress={() => router.push("/bookings")} />
        <ListItem title="My Reviews" leading={<Icon name="star.fill" size={18} color={iconColor} />} onPress={() => router.push("/my-reviews")} />
        <ListItem title="Favorites" leading={<Icon name="heart.fill" size={18} color={iconColor} />} onPress={() => router.push("/favorites")} />
      </ListSection>

      <ListSection title="Account">
        <ListItem title="Refer & Earn" subtitle={profile?.referral_code ?? ""} leading={<Icon name="sparkles" size={18} color={iconColor} />} onPress={() => router.push("/refer")} />
        <ListItem title="Help & Support" leading={<Icon name="info.circle" size={18} color={iconColor} />} onPress={() => router.push("/support")} />
        <ListItem title="Notifications" leading={<Icon name="bell.fill" size={18} color={iconColor} />} onPress={() => router.push("/notifications")} />
      </ListSection>

      <ListSection>
        <ListItem
          title="Sign out"
          destructive
          leading={<Icon name="arrow.right" size={18} color="#EF4444" />}
          chevron={false}
          onPress={async () => {
            if (Platform.OS === "web") {
              if (!window.confirm("Sign out? You can sign back in anytime.")) return;
            }
            await signOut();
            router.replace("/login");
          }}
        />
      </ListSection>

      <View className="mt-8 items-center pb-6">
        <Text className="text-[11px] text-dime-ink-4">DIME · Made in Bengaluru</Text>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-[22px] font-bold text-white" style={{ letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[10px] font-bold uppercase text-white/40" style={{ letterSpacing: 1.5 }}>
        {label}
      </Text>
    </View>
  );
}
