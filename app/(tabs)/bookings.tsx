import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState, Header, Icon, Screen, Badge } from "@/components/ui";
import { useMyBookings } from "@/hooks/queries";
import { fullDate, time12 } from "@/lib/format";

export default function Bookings() {
  const router = useRouter();
  const { data } = useMyBookings();

  const statusTone = (s: string): { tone: "green" | "orange" | "gray" | "red"; label: string } => {
    switch (s) {
      case "confirmed": return { tone: "green", label: "Confirmed" };
      case "pending": return { tone: "orange", label: "Pending" };
      case "arrived": return { tone: "green", label: "Arrived" };
      case "completed": return { tone: "gray", label: "Completed" };
      case "cancelled": return { tone: "red", label: "Cancelled" };
      case "no_show": return { tone: "red", label: "No show" };
      default: return { tone: "gray", label: s };
    }
  };

  return (
    <Screen scroll={false}>
      <Header title="My Bookings" />
      <FlatList
        data={data ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const st = statusTone(item.status);
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item.id } })}
              className="flex-row gap-3 overflow-hidden rounded-2xl border border-dime-border bg-white p-3"
            >
              <Image source={{ uri: item.restaurants.cover_image_url ?? "" }} className="h-20 w-20 rounded-xl" />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[15px] font-semibold text-dime-ink">{item.restaurants.name}</Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <Icon name="calendar" size={13} color="#8E8E93" />
                  <Text className="text-[12px] text-dime-ink-2">{fullDate(item.date)} • {time12(item.time)}</Text>
                </View>
                <Text className="mt-0.5 text-[12px] text-dime-ink-3">{item.guests} guests • {item.seating_preference}</Text>
                <View className="mt-2">
                  <Badge tone={st.tone} label={st.label} />
                </View>
              </View>
              <Icon name="chevron.right" size={16} color="#C7C7CC" />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No bookings yet"
            message="Book a table at your favourite restaurant to see it here."
            actionLabel="Discover restaurants"
            onAction={() => router.push("/discover")}
          />
        }
      />
    </Screen>
  );
}
