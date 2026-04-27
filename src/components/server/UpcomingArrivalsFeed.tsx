import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Avatar, Icon, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { time12 } from "@/lib/format";

type UpcomingBooking = {
  id: string;
  date: string;
  time: string;
  guests: number;
  seating_preference: string;
  status: string;
  occasion: string | null;
  users: { name: string | null; phone: string | null }[] | { name: string | null; phone: string | null } | null;
  tables: { number: number }[] | { number: number } | null;
};

function single<T>(rel: T[] | T | null): T | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

/**
 * Surfaces bookings whose start time falls within the next 30 minutes
 * so the server has time to lay the table, brief the host, etc.
 * Realtime-subscribed: confirmations, cancellations, arrivals all
 * propagate without a refresh.
 */
export function UpcomingArrivalsFeed({ restaurantId }: { restaurantId?: string }) {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["server-upcoming", restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const today = dayjs().format("YYYY-MM-DD");
      const { data, error } = await supabase
        .from("bookings")
        .select("id, date, time, guests, seating_preference, status, occasion, users(name, phone), tables(number)")
        .eq("restaurant_id", restaurantId!)
        .eq("date", today)
        .in("status", ["confirmed", "pending"])
        .order("time");
      if (error) throw error;
      return data as unknown as UpcomingBooking[];
    },
  });

  useEffect(() => {
    if (!restaurantId) return;
    const ch = supabase
      .channel(`upcoming-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `restaurant_id=eq.${restaurantId}` },
        () => refetch()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, refetch]);

  // Filter to bookings within the next 30 minutes (or already past their slot but still pending)
  const now = dayjs();
  const horizon = now.add(30, "minute");
  const upcoming = (data ?? []).filter((b) => {
    const slot = dayjs(`${b.date}T${b.time}`);
    return slot.isAfter(now.subtract(15, "minute")) && slot.isBefore(horizon);
  });

  async function markArrived(id: string) {
    await supabase.from("bookings").update({ status: "arrived" }).eq("id", id);
    haptic.success();
    qc.invalidateQueries({ queryKey: ["server-upcoming"] });
  }

  if (upcoming.length === 0) return null;

  return (
    <View className="mx-4 mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-amber-500" />
        <Text className="text-[12px] font-bold uppercase tracking-widest text-amber-700">Arriving soon</Text>
        <View className="ml-auto rounded-full bg-amber-500 px-2 py-0.5">
          <Text className="text-[11px] font-bold text-white">{upcoming.length}</Text>
        </View>
      </View>

      <View className="mt-2 gap-2">
        {upcoming.map((b) => {
          const user = single(b.users);
          const table = single(b.tables);
          const slot = dayjs(`${b.date}T${b.time}`);
          const minsAway = Math.max(0, slot.diff(now, "minute"));
          const overdue = slot.isBefore(now);
          return (
            <View key={b.id} className="flex-row items-center gap-3 rounded-xl border border-amber-200 bg-white p-3">
              <Avatar name={user?.name ?? "Guest"} size={36} />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{user?.name ?? "Walk-in"}</Text>
                <Text className="text-[12px] text-dime-ink-2">
                  {b.guests} {b.guests === 1 ? "guest" : "guests"} · {b.seating_preference}
                  {table ? ` · Table ${table.number}` : ""}
                  {b.occasion ? ` · ${b.occasion}` : ""}
                </Text>
                <Text className="text-[11px] text-dime-ink-3">
                  {time12(b.time)} · {overdue ? "running late" : `${minsAway} min`}
                </Text>
              </View>
              <Pressable
                onPress={() => markArrived(b.id)}
                className="rounded-full bg-emerald-500 px-3 py-1.5"
              >
                <Icon name="checkmark" size={14} color="#fff" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
