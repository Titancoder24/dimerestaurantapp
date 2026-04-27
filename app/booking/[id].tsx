import { Text, View } from "react-native";
import { confirm } from "@/lib/confirm";
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
    confirm("Cancel booking?", "This cannot be undone.", async () => {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
      refetch();
    });
  }

  if (!booking) return null;

  return (
    <Screen>
      <Header title="Booking details" back />

      <View
        className="mx-5 items-center rounded-[22px] bg-white p-8"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 }}
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <Icon name="checkmark.circle.fill" size={36} color="#16A34A" />
        </View>
        <Text className="mt-4 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
          {booking.restaurants.name}
        </Text>
        <View className="mt-2">
          <Badge
            tone={booking.status === "confirmed" ? "green" : booking.status === "cancelled" ? "red" : "gray"}
            label={booking.status}
          />
        </View>

        <View className="mt-6 w-full gap-4 border-t border-neutral-100 pt-6">
          <Row icon="calendar" label="Date" value={fullDate(booking.date)} />
          <Row icon="clock.fill" label="Time" value={time12(booking.time)} />
          <Row icon="person.fill" label="Party size" value={`${booking.guests} guests`} />
          <Row icon="tablecells" label="Seating" value={booking.seating_preference} />
          {booking.occasion ? <Row icon="sparkles" label="Occasion" value={booking.occasion} /> : null}
        </View>

        <View className="mt-6 items-center">
          <View className="rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <QRCode value={`dime-booking:${booking.id}`} size={140} color="#1C1C1E" backgroundColor="#FFFFFF" />
          </View>
          <Text className="mt-3 text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Show at the host stand
          </Text>
        </View>
      </View>

      {booking.status !== "cancelled" && booking.status !== "completed" ? (
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
      <View>
        <Text className="text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1 }}>{label}</Text>
        <Text className="text-[15px] font-semibold text-dime-ink">{value}</Text>
      </View>
    </View>
  );
}
