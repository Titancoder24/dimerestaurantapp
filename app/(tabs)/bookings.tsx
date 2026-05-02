import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState, Icon, Screen, Badge } from "@/components/ui";
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
      <View className="bg-white px-4 pb-3 pt-3">
        <Text className="text-[22px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.5 }}>My Bookings</Text>
        <Text className="mt-0.5 text-[13px] text-[#93959F]">{data?.length ?? 0} reservations</Text>
      </View>

      <View className="h-2 bg-[#F2F2F2]" />

      <FlatList
        data={data ?? []}
        keyExtractor={(b) => b.id}
        className="bg-white"
        contentContainerStyle={{ paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View className="mx-4 h-px bg-[#F0F0F0]" />}
        renderItem={({ item }) => {
          const st = statusTone(item.status);
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item.id } })}
              className="flex-row gap-3 px-4 py-3.5"
            >
              <View className="overflow-hidden rounded-[12px]">
                <Image source={{ uri: item.restaurants.cover_image_url ?? "" }} className="h-[76px] w-[76px]" resizeMode="cover" />
              </View>
              <View className="flex-1 justify-center">
                <Text numberOfLines={1} className="text-[15px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.2 }}>
                  {item.restaurants.name}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Icon name="calendar" size={11} color="#93959F" />
                  <Text className="text-[12px] text-[#535665]">{fullDate(item.date)} · {time12(item.time)}</Text>
                </View>
                <Text className="mt-0.5 text-[12px] text-[#93959F]">{item.guests} guests · {item.seating_preference}</Text>
                <View className="mt-1.5">
                  <Badge tone={st.tone} label={st.label} />
                </View>
              </View>
              <View className="justify-center">
                <Icon name="chevron.right" size={13} color="#D4D4D8" />
              </View>
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
