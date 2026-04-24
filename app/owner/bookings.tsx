import { Text, View, FlatList, Pressable } from "react-native";
import { Avatar, Badge, Header, Screen } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantBookings } from "@/hooks/owner";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { fullDate, time12 } from "@/lib/format";

export default function OwnerBookings() {
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: bookings } = useRestaurantBookings(restaurant?.id);

  async function setStatus(id: string, status: "confirmed" | "arrived" | "cancelled" | "no_show" | "completed") {
    await supabase.from("bookings").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["restaurant-bookings"] });
  }

  return (
    <Screen scroll={false}>
      <Header title="Bookings" subtitle={`${bookings?.length ?? 0} total`} />
      <FlatList
        data={bookings ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: b }) => (
          <View className="rounded-2xl border border-dime-border bg-white p-3">
            <View className="flex-row items-center gap-3">
              <Avatar name={b.users?.name ?? "Walk-in"} size={36} />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{b.users?.name ?? "Walk-in"}</Text>
                <Text className="text-[11px] text-dime-ink-3">{fullDate(b.date)} • {time12(b.time)} • {b.guests} guests</Text>
              </View>
              <Badge tone={b.status === "confirmed" ? "green" : b.status === "cancelled" ? "red" : "orange"} label={b.status} />
            </View>
            <View className="mt-3 flex-row gap-2">
              {b.status === "pending" ? (
                <Pressable onPress={() => setStatus(b.id, "confirmed")} className="flex-1 items-center rounded-lg bg-dime-orange-500 py-2">
                  <Text className="text-[12px] font-semibold text-white">Confirm</Text>
                </Pressable>
              ) : null}
              {b.status === "confirmed" ? (
                <Pressable onPress={() => setStatus(b.id, "arrived")} className="flex-1 items-center rounded-lg bg-emerald-500 py-2">
                  <Text className="text-[12px] font-semibold text-white">Arrived</Text>
                </Pressable>
              ) : null}
              {(b.status === "confirmed" || b.status === "pending") ? (
                <Pressable onPress={() => setStatus(b.id, "no_show")} className="flex-1 items-center rounded-lg border border-dime-border bg-white py-2">
                  <Text className="text-[12px] font-semibold text-dime-ink-2">No show</Text>
                </Pressable>
              ) : null}
              {b.status !== "cancelled" && b.status !== "completed" ? (
                <Pressable onPress={() => setStatus(b.id, "cancelled")} className="flex-1 items-center rounded-lg border border-red-300 bg-white py-2">
                  <Text className="text-[12px] font-semibold text-dime-danger">Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
