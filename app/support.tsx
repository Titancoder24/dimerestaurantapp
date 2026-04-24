import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Chip, Header, Input, Screen } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { useRouter } from "expo-router";

const categories = [
  { k: "order_issue", l: "Order issue" },
  { k: "payment_issue", l: "Payment" },
  { k: "booking_issue", l: "Booking" },
  { k: "app_bug", l: "App bug" },
  { k: "feedback", l: "Feedback" },
  { k: "other", l: "Other" },
];

export default function Support() {
  const profile = useAuth((s) => s.profile);
  const toast = useToast();
  const router = useRouter();
  const [category, setCategory] = useState("order_issue");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!profile) return;
    if (subject.length < 4 || message.length < 10) return toast.error("Please fill both fields");
    setLoading(true);
    try {
      const { data: t, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: profile.id, category: category as never, subject })
        .select().single();
      if (error) throw error;
      await supabase.from("support_messages").insert({
        ticket_id: t.id, sender_type: "user", sender_id: profile.id, message,
      });
      toast.success("Ticket created", `We'll reply within 24 hours`);
      router.back();
    } catch (e) {
      toast.error("Could not submit", (e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <Screen>
      <Header title="Help & Support" back />
      <View className="px-4 gap-3">
        <Text className="text-[13px] font-semibold text-dime-ink-2">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((c) => (
            <Chip key={c.k} label={c.l} selected={category === c.k} onPress={() => setCategory(c.k)} />
          ))}
        </View>
        <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Brief summary" />
        <Input label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={5} placeholder="Tell us what happened..." />
      </View>
      <View className="mx-4 mt-6">
        <Button label="Submit ticket" loading={loading} onPress={submit} fullWidth />
      </View>
    </Screen>
  );
}
