import { useEffect } from "react";
import { Text, View } from "react-native";
import { confirm } from "@/lib/confirm";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { Button, Header, Icon, Screen, Badge } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { fullDate, time12, rupees } from "@/lib/format";

type PreOrderItem = { menu_item_id: string; name: string; price: number; quantity: number };

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: booking, refetch } = useQuery({
    queryKey: ["booking", id],
    enabled: !!id,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, restaurants(name, address, phone, cover_image_url)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string; date: string; time: string; guests: number;
        seating_preference: string; occasion: string | null;
        special_requests: string | null; status: string;
        response_note: string | null; pre_order: PreOrderItem[] | null;
        restaurants: { name: string; address: string | null; phone: string | null; cover_image_url: string | null };
      } | null;
    },
  });

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`booking-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  async function cancel() {
    if (!id) return;
    confirm("Cancel booking?", "This cannot be undone.", async () => {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
      refetch();
    });
  }

  if (!booking) return null;

  const isPending = booking.status === "pending";
  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";
  const isRejected = booking.status === "rejected";

  const statusIcon = isPending
    ? { name: "clock.fill", color: "#FF6B2C", bg: "bg-orange-50" }
    : isConfirmed
    ? { name: "checkmark.circle.fill", color: "#16A34A", bg: "bg-emerald-50" }
    : isCancelled || isRejected
    ? { name: "xmark.circle.fill", color: "#EF4444", bg: "bg-red-50" }
    : { name: "checkmark.circle.fill", color: "#16A34A", bg: "bg-emerald-50" };

  const preOrderTotal = (booking.pre_order ?? []).reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Screen>
      <Header title="Booking details" back />

      <View
        className="mx-5 items-center rounded-[22px] bg-white p-8"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
      >
        <View className={`h-16 w-16 items-center justify-center rounded-full ${statusIcon.bg}`}>
          <Icon name={statusIcon.name} size={36} color={statusIcon.color} />
        </View>
        <Text className="mt-4 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
          {booking.restaurants.name}
        </Text>
        <View className="mt-2">
          <Badge
            tone={isConfirmed ? "green" : isPending ? "orange" : isCancelled || isRejected ? "red" : "gray"}
            label={isPending ? "Awaiting confirmation" : booking.status}
          />
        </View>

        {isPending ? (
          <Text className="mt-3 text-center text-[13px] text-dime-ink-3">
            The restaurant is reviewing your reservation. You'll be notified once they respond.
          </Text>
        ) : null}

        {isRejected && booking.response_note ? (
          <View className="mt-3 w-full rounded-xl bg-red-50 p-3">
            <Text className="text-[11px] font-bold uppercase text-red-700" style={{ letterSpacing: 1 }}>Reason</Text>
            <Text className="mt-1 text-[13px] text-red-900">{booking.response_note}</Text>
          </View>
        ) : null}

        <View className="mt-6 w-full gap-4 border-t border-neutral-100 pt-6">
          <Row icon="calendar" label="Date" value={fullDate(booking.date)} />
          <Row icon="clock.fill" label="Time" value={time12(booking.time)} />
          <Row icon="person.fill" label="Party size" value={`${booking.guests} guests`} />
          <Row icon="tablecells" label="Seating" value={booking.seating_preference} />
          {booking.occasion ? <Row icon="sparkles" label="Occasion" value={booking.occasion} /> : null}
          {booking.special_requests ? <Row icon="text.bubble.fill" label="Requests" value={booking.special_requests} /> : null}
        </View>

        {isConfirmed ? (
          <View className="mt-6 items-center">
            <View className="rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <QRCode value={`dime-booking:${booking.id}`} size={140} color="#1C1C1E" backgroundColor="#FFFFFF" />
            </View>
            <Text className="mt-3 text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
              Show at the host stand
            </Text>
          </View>
        ) : null}
      </View>

      {booking.pre_order && booking.pre_order.length > 0 ? (
        <View className="mx-5 mt-5 overflow-hidden rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          <View className="flex-row items-center justify-between border-b border-neutral-50 px-5 py-4">
            <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Pre-ordered items</Text>
            <Text className="text-[13px] font-semibold text-dime-ink-2">{rupees(preOrderTotal)}</Text>
          </View>
          {booking.pre_order.map((item, idx) => (
            <View key={item.menu_item_id} className={`flex-row items-center gap-4 px-5 py-3.5 ${idx > 0 ? "border-t border-neutral-50" : ""}`}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-primary-50">
                <Text className="text-[13px] font-bold text-dime-primary-600">{item.quantity}×</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{item.name}</Text>
              </View>
              <Text className="text-[14px] font-semibold text-dime-ink-2">{rupees(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "rejected" ? (
        <View className="mx-5 mt-5 pb-8">
          <Button label="Cancel booking" variant="destructive" onPress={cancel} fullWidth />
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-primary-50">
        <Icon name={icon} size={16} color="#FF6B2C" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1 }}>{label}</Text>
        <Text className="text-[15px] font-semibold text-dime-ink">{value}</Text>
      </View>
    </View>
  );
}
