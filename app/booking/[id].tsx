import { Text, View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { Button, Header, Icon, Screen, Badge } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { fullDate, time12 } from "@/lib/format";

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: booking, refetch } = useQuery({
    queryKey: ["booking", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, restaurants(name, address, phone, cover_image_url)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; date: string; time: string; guests: number; seating_preference: string; occasion: string | null; special_requests: string | null; status: string; restaurants: { name: string; address: string | null; phone: string | null; cover_image_url: string | null } } | null;
    },
  });

  async function cancel() {
    if (!id) return;
    Alert.alert("Cancel booking?", "This cannot be undone.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: async () => {
          await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
          refetch();
        },
      },
    ]);
  }

  if (!booking) return null;

  return (
    <Screen>
      <Header title="Booking details" back />

      <View className="mx-4 items-center rounded-3xl bg-white border border-dime-border p-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Icon name="checkmark.circle.fill" size={30} color="#22C55E" />
        </View>
        <Text className="mt-3 text-[20px] font-semibold text-dime-ink">{booking.restaurants.name}</Text>
        <Badge
          tone={booking.status === "confirmed" ? "green" : booking.status === "cancelled" ? "red" : "gray"}
          label={booking.status}
        />

        <View className="mt-5 w-full gap-3 border-t border-dime-border pt-4">
          <Row icon="calendar" label="Date" value={fullDate(booking.date)} />
          <Row icon="clock.fill" label="Time" value={time12(booking.time)} />
          <Row icon="person.fill" label="Party size" value={`${booking.guests} guests`} />
          <Row icon="tablecells" label="Seating" value={booking.seating_preference} />
          {booking.occasion ? <Row icon="sparkles" label="Occasion" value={booking.occasion} /> : null}
        </View>

        <View className="mt-5 items-center">
          <View className="rounded-2xl border border-dime-border bg-white p-4">
            <QRCode value={`dime-booking:${booking.id}`} size={140} color="#1C1C1E" backgroundColor="#FFFFFF" />
          </View>
          <Text className="mt-2 text-[11px] uppercase tracking-widest text-dime-ink-3">
            Show at the host stand
          </Text>
        </View>
      </View>

      {booking.status !== "cancelled" && booking.status !== "completed" ? (
        <View className="mx-4 mt-4">
          <Button label="Cancel booking" variant="destructive" onPress={cancel} fullWidth />
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <Icon name={icon} size={16} color="#FC8019" />
      <Text className="w-20 text-[12px] uppercase tracking-widest text-dime-ink-3">{label}</Text>
      <Text className="flex-1 text-[14px] font-medium text-dime-ink">{value}</Text>
    </View>
  );
}
