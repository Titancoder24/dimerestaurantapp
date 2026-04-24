import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Avatar, Badge, Button, Header, Screen, StarRating, Sheet } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantReviews } from "@/hooks/owner";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/format";

export default function OwnerReviews() {
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: reviews } = useRestaurantReviews(restaurant?.id);

  const [reply, setReply] = useState<{ id: string; current: string } | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const avg = reviews && reviews.length ? reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length : 0;

  async function submit() {
    if (!reply) return;
    setSaving(true);
    await supabase.from("reviews").update({ reply_text: text, reply_at: new Date().toISOString() }).eq("id", reply.id);
    qc.invalidateQueries({ queryKey: ["restaurant-reviews"] });
    setReply(null);
    setText("");
    setSaving(false);
  }

  return (
    <Screen>
      <Header title="Reviews" subtitle={`${reviews?.length ?? 0} total • ${avg.toFixed(1)}★`} />

      <View className="mx-4 gap-3">
        {(reviews ?? []).map((r) => (
          <View key={r.id} className="rounded-2xl border border-dime-border bg-white p-3">
            <View className="flex-row items-center gap-2">
              <Avatar name={r.users?.name} size={36} />
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-dime-ink">{r.users?.name ?? "Diner"}</Text>
                <Text className="text-[11px] text-dime-ink-3">{timeAgo(r.created_at)}</Text>
              </View>
              <StarRating value={r.overall_rating} readOnly size={14} />
            </View>
            {r.text ? <Text className="mt-2 text-[13px] text-dime-ink-2">{r.text}</Text> : null}
            {r.reply_text ? (
              <View className="mt-2 rounded-xl bg-dime-bg-2 p-2">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-orange-700">Your reply</Text>
                <Text className="text-[13px] text-dime-ink-2">{r.reply_text}</Text>
              </View>
            ) : (
              <View className="mt-2">
                <Pressable
                  onPress={() => { setReply({ id: r.id, current: "" }); setText(""); }}
                  className="self-start rounded-full border border-dime-border px-3 py-1.5"
                >
                  <Text className="text-[12px] font-semibold text-dime-orange-600">Reply</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>

      <Sheet visible={!!reply} onClose={() => setReply(null)} maxHeight="60%">
        <Sheet.Body>
          <Text className="text-[15px] font-semibold text-dime-ink">Reply to diner</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Thank your customer, address concerns..."
            placeholderTextColor="#8E8E93"
            className="mt-3 min-h-[120px] rounded-xl border border-dime-border bg-white p-3 text-[14px] text-dime-ink"
            textAlignVertical="top"
          />
          <View className="mt-4">
            <Button label="Post reply" loading={saving} onPress={submit} fullWidth />
          </View>
        </Sheet.Body>
      </Sheet>
    </Screen>
  );
}
