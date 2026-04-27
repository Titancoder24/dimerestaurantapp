import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Chip, Header, Icon, Input, Screen, Stepper, haptic } from "@/components/ui";
import { useRestaurant } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import dayjs from "dayjs";

const timeSlots = {
  lunch: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"],
  dinner: ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
};
const seatingOptions: ("any" | "indoor" | "outdoor" | "rooftop" | "private" | "bar")[] = [
  "any", "indoor", "outdoor", "rooftop", "private", "bar",
];
const occasions = ["Birthday", "Anniversary", "Date Night", "Business", "Family", "Other"];

export default function NewBooking() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const router = useRouter();
  const { data: restaurant } = useRestaurant(restaurantId);
  const profile = useAuth((s) => s.profile);
  const toast = useToast();

  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [seating, setSeating] = useState<(typeof seatingOptions)[number]>("any");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const days = Array.from({ length: 14 }).map((_, i) => dayjs().add(i, "day"));

  async function submit() {
    if (!restaurantId || !profile || !time) {
      toast.error(time ? "Missing details" : "Pick a time");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: profile.id,
          restaurant_id: restaurantId,
          date: dayjs().add(dayOffset, "day").format("YYYY-MM-DD"),
          time: `${time}:00`,
          guests,
          seating_preference: seating,
          occasion,
          special_requests: notes || null,
          status: "confirmed",
          source: "app",
        })
        .select()
        .single();
      if (error) throw error;
      haptic.success();
      router.replace({ pathname: "/booking-confirm/[id]", params: { id: data.id } });
    } catch (e) {
      haptic.error();
      toast.error("Could not book", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Header title="Book a table" subtitle={restaurant?.name} back />

      <View className="px-5">
        <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
          Pick a date
        </Text>
        <FlatList
          horizontal
          data={days}
          keyExtractor={(d) => d.format("YYYY-MM-DD")}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item, index }) => {
            const selected = dayOffset === index;
            return (
              <Pressable
                onPress={() => { haptic.select(); setDayOffset(index); }}
                className={`w-[66px] items-center rounded-2xl py-3 ${selected ? "bg-dime-ink" : "bg-dime-bg-2"}`}
              >
                <Text className={`text-[10px] font-bold uppercase ${selected ? "text-white/60" : "text-dime-ink-4"}`} style={{ letterSpacing: 1 }}>
                  {item.format("ddd")}
                </Text>
                <Text className={`text-[20px] font-bold ${selected ? "text-white" : "text-dime-ink"}`} style={{ letterSpacing: -0.5 }}>
                  {item.format("DD")}
                </Text>
                <Text className={`text-[10px] ${selected ? "text-white/60" : "text-dime-ink-4"}`}>{item.format("MMM")}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Lunch</Text>
        <View className="flex-row flex-wrap gap-2">
          {timeSlots.lunch.map((t) => (
            <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
          ))}
        </View>
        <Text className="mb-3 mt-5 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Dinner</Text>
        <View className="flex-row flex-wrap gap-2">
          {timeSlots.dinner.map((t) => (
            <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
          ))}
        </View>
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Guests</Text>
        <View className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          <Text className="text-[16px] font-semibold text-dime-ink">{guests} {guests === 1 ? "guest" : "guests"}</Text>
          <Stepper value={guests} onChange={setGuests} min={1} max={20} />
        </View>
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Seating preference</Text>
        <View className="flex-row flex-wrap gap-2">
          {seatingOptions.map((s) => (
            <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} selected={seating === s} onPress={() => setSeating(s)} />
          ))}
        </View>
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Occasion</Text>
        <View className="flex-row flex-wrap gap-2">
          {occasions.map((o) => (
            <Chip key={o} label={o} selected={occasion === o} onPress={() => setOccasion(occasion === o ? null : o)} />
          ))}
        </View>
      </View>

      <View className="mt-6 px-5">
        <Input label="Special requests" placeholder="Any preferences..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
      </View>

      <View className="mx-5 mt-8 mb-8">
        <Button label="Confirm booking" size="lg" loading={saving} onPress={submit} fullWidth />
      </View>
    </Screen>
  );
}
