import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon, Screen, EmptyState } from "@/components/ui";
import { useMyBookings } from "@/hooks/queries";
import { fullDate, time12 } from "@/lib/format";
import { T } from "@/lib/visual";
import { Img, Pill, display, mono, num } from "@/components/dime/atoms";

const statusStyles: Record<string, { label: string; bg: string; col: string }> = {
  pending: { label: "PENDING", bg: "#FFEDD7", col: T.saffron },
  confirmed: { label: "CONFIRMED", bg: T.forestSoft, col: T.forest },
  arrived: { label: "ARRIVED", bg: T.forestSoft, col: T.forest },
  completed: { label: "COMPLETED", bg: T.cream, col: T.muted },
  cancelled: { label: "CANCELLED", bg: T.rubySoft, col: T.ruby },
  no_show: { label: "NO SHOW", bg: T.rubySoft, col: T.ruby },
};

export default function Bookings() {
  const router = useRouter();
  const { data } = useMyBookings();

  const items = useMemo(() => data ?? [], [data]);

  return (
    <Screen scroll={false} className="bg-[#F6F2EC]">
      <View style={{ paddingTop: 14, paddingHorizontal: 18, paddingBottom: 8 }}>
        <Text style={display(28, "600", -0.6)}>My Bookings</Text>
        <Text style={[num(12, "500"), { color: T.muted, marginTop: 1 }]}>
          {items.length} {items.length === 1 ? "reservation" : "reservations"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, gap: 10, paddingTop: 14, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((b) => {
          const st = statusStyles[b.status] ?? { label: b.status.toUpperCase(), bg: T.cream, col: T.muted };
          return (
            <Pressable
              key={b.id}
              onPress={() => router.push({ pathname: "/booking/[id]", params: { id: b.id } })}
              style={{
                backgroundColor: T.card, borderRadius: 16, padding: 12,
                borderWidth: 1, borderColor: T.hairline,
                flexDirection: "row", alignItems: "center", gap: 12,
              }}
            >
              <Img uri={b.restaurants.cover_image_url} kind="restaurant" h={64} w={64} radius={12} hue={28} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: "700", letterSpacing: -0.2, color: T.ink }}>
                  {b.restaurants.name}
                </Text>
                <Text style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>
                  {fullDate(b.date)} · {time12(b.time)}
                </Text>
                <Text style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>
                  {b.guests} {b.guests === 1 ? "guest" : "guests"} · {b.seating_preference}
                </Text>
              </View>
              <Pill
                bg={st.bg}
                color={st.col}
                size={10}
                textStyle={{ letterSpacing: 1, textTransform: "uppercase", fontFamily: T.fontMono }}
              >
                {st.label}
              </Pill>
            </Pressable>
          );
        })}
        {items.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No bookings yet"
            message="Book a table at your favourite restaurant to see it here."
            actionLabel="Discover restaurants"
            onAction={() => router.push("/discover")}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
