import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { T } from "@/lib/visual";
import { display, mono } from "@/components/dime/atoms";
import { initials } from "@/lib/format";

const preferences = [
  { title: "Food Preferences", icon: "leaf.fill", route: "/preferences" },
  { title: "Offers & Promos", icon: "gift.fill", route: "/offers" },
] as const;

const activity = [
  { title: "My Orders", icon: "bag.fill", route: "/orders" },
  { title: "My Bookings", icon: "calendar", route: "/bookings" },
  { title: "My Reviews", icon: "star.fill", route: "/my-reviews" },
  { title: "Favourites", icon: "heart.fill", route: "/favorites" },
] as const;

const account = [
  { title: "Help & Support", icon: "questionmark.circle", route: "/support" },
  { title: "Notifications", icon: "bell.fill", route: "/notifications" },
] as const;

export default function Profile() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);

  return (
    <Screen scroll={false} className="bg-[#F6F2EC]">
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 18 }}>
          <Text style={display(28, "600", -0.6)}>Account</Text>
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          <Pressable
            onPress={() => { haptic.light(); router.push("/edit-profile"); }}
            style={{
              backgroundColor: T.card, borderRadius: 18, padding: 14,
              borderWidth: 1, borderColor: T.hairline,
              flexDirection: "row", alignItems: "center", gap: 14,
            }}
          >
            {profile?.avatar_url ? (
              <Avatar uri={profile.avatar_url} size={56} />
            ) : (
              <View
                style={{
                  width: 56, height: 56, borderRadius: 999,
                  backgroundColor: T.saffron,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
                  {initials(profile?.name ?? "")}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={display(18, "600", -0.3)}>{profile?.name ?? "Guest"}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: T.muted }}>{profile?.email}</Text>
              <View
                style={{
                  marginTop: 8, alignSelf: "flex-start",
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                  backgroundColor: T.cream,
                  flexDirection: "row", alignItems: "center", gap: 5,
                }}
              >
                <Icon name="sparkles" size={11} color={T.saffron} />
                <Text style={[mono(10, "700", 1.1), { color: T.saffron, textTransform: "uppercase" }]}>
                  DIME Member
                </Text>
              </View>
            </View>
            <Icon name="chevron.right" size={16} color={T.muted} />
          </Pressable>
        </View>

        <Section title="PREFERENCES" items={preferences} router={router} />
        <Section title="ACTIVITY" items={activity} router={router} />
        <Section title="ACCOUNT" items={account} router={router} />

        {/* Sign out */}
        <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
          <Pressable
            onPress={async () => {
              haptic.light();
              if (Platform.OS === "web") {
                if (!window.confirm("Sign out? You can sign back in anytime.")) return;
              }
              await signOut();
              router.replace("/login");
            }}
            style={{
              backgroundColor: T.card, borderRadius: 16, padding: 14,
              borderWidth: 1, borderColor: T.hairline,
              flexDirection: "row", alignItems: "center", gap: 12,
            }}
          >
            <View
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: T.rubySoft,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="arrow.right" size={16} color={T.ruby} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: T.ruby }}>Sign out</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: "center", paddingTop: 26 }}>
          <Text style={[mono(11, "600", 1.2)]}>DIME v1.0 · MADE IN BENGALURU</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  items,
  router,
}: {
  title: string;
  items: readonly { title: string; icon: string; route: string }[];
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 22 }}>
      <Text style={[mono(11, "700", 1.4), { marginBottom: 10 }]}>{title}</Text>
      <View
        style={{
          backgroundColor: T.card, borderRadius: 18,
          borderWidth: 1, borderColor: T.hairline, overflow: "hidden",
        }}
      >
        {items.map((item, i) => (
          <Pressable
            key={item.route}
            onPress={() => { haptic.light(); router.push(item.route as never); }}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingHorizontal: 14, paddingVertical: 14,
              borderTopWidth: i > 0 ? 1 : 0, borderTopColor: T.hairline,
            }}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: T.cream,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name={item.icon} size={15} color={T.ink} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: T.ink }}>{item.title}</Text>
            <Icon name="chevron.right" size={14} color={T.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
