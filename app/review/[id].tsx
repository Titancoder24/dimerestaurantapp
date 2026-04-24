import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Chip, ChipRow, Header, Screen, StarRating, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // order id
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const toast = useToast();

  const [overall, setOverall] = useState(5);
  const [food, setFood] = useState(5);
  const [service, setService] = useState(5);
  const [ambience, setAmbience] = useState(5);
  const [value, setValue] = useState(5);
  const [text, setText] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!profile || !id) return;
    setSaving(true);
    try {
      const { data: order, error: oErr } = await supabase
        .from("orders").select("restaurant_id").eq("id", id).maybeSingle();
      if (oErr) throw oErr;
      if (!order) throw new Error("Order not found");

      const { error } = await supabase.from("reviews").insert({
        user_id: profile.id,
        restaurant_id: order.restaurant_id,
        order_id: id,
        overall_rating: overall,
        food_rating: food,
        service_rating: service,
        ambience_rating: ambience,
        value_rating: value,
        text: text || null,
        recommend,
        is_published: true,
      });
      if (error) throw error;

      await supabase.from("loyalty_transactions").insert({
        user_id: profile.id,
        type: "earned_review",
        points: 50,
        reference_id: id,
        description: "Earned from writing a review",
        expires_at: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
      });

      haptic.success();
      toast.success("Thanks for the feedback", "+50 loyalty points");
      router.replace("/home");
    } catch (e) {
      haptic.error();
      toast.error("Could not save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Header title="Rate your experience" back />

      <View className="mx-4 items-center rounded-2xl bg-white border border-dime-border p-6">
        <Text className="text-[13px] text-dime-ink-3">Overall</Text>
        <View className="mt-2">
          <StarRating value={overall} onChange={setOverall} size={36} />
        </View>
        <Text className="mt-2 text-[16px] font-semibold text-dime-ink">
          {overall === 5 ? "Loved it" : overall === 4 ? "Pretty great" : overall === 3 ? "It was okay" : overall === 2 ? "Meh" : "Not great"}
        </Text>
      </View>

      <View className="mx-4 mt-4 rounded-2xl bg-white border border-dime-border p-4">
        <Category label="Food" value={food} onChange={setFood} />
        <Category label="Service" value={service} onChange={setService} />
        <Category label="Ambience" value={ambience} onChange={setAmbience} />
        <Category label="Value" value={value} onChange={setValue} />
      </View>

      <View className="mx-4 mt-4 rounded-2xl bg-white border border-dime-border p-4">
        <Text className="text-[13px] font-semibold text-dime-ink-2">Tell us more (optional)</Text>
        <TextInput
          multiline
          numberOfLines={4}
          placeholder="What made it memorable?"
          placeholderTextColor="#8E8E93"
          value={text}
          onChangeText={setText}
          className="mt-2 min-h-[100px] rounded-xl border border-dime-border bg-white p-3 text-[14px] text-dime-ink"
          textAlignVertical="top"
        />
      </View>

      <View className="mx-4 mt-4">
        <Text className="mb-2 text-[13px] font-semibold text-dime-ink-2">Would you recommend?</Text>
        <ChipRow>
          <Chip label="Absolutely" selected={recommend} onPress={() => setRecommend(true)} />
          <Chip label="Not really" selected={!recommend} onPress={() => setRecommend(false)} />
        </ChipRow>
      </View>

      <View className="mx-4 mt-6">
        <Button label="Submit review" size="lg" loading={saving} onPress={submit} fullWidth />
      </View>
    </Screen>
  );
}

function Category({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-[14px] font-medium text-dime-ink">{label}</Text>
      <StarRating value={value} onChange={onChange} size={24} />
    </View>
  );
}
