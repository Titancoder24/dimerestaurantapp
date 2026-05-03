// Write review screen with star rating + per-axis breakdown.
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useRestaurant } from "@/hooks/queries";
import { useSubmitReview } from "@/hooks/chat";
import { useToast } from "@/store/toast";
import { T } from "@/lib/visual";
import { Img } from "@/components/dime/atoms";

const RATING_LABELS = ["Awful", "Poor", "OK", "Good", "Excellent"];

export default function WriteReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const toast = useToast();
  const { data: restaurant } = useRestaurant(id);
  const submit = useSubmitReview();

  const [overall, setOverall] = useState(0);
  const [food, setFood] = useState(0);
  const [beverages, setBeverages] = useState(0);
  const [service, setService] = useState(0);
  const [text, setText] = useState("");

  const canSubmit = overall > 0 && profile?.id;

  const handleSubmit = async () => {
    if (!canSubmit || !id || !profile?.id) return;
    try {
      await submit.mutateAsync({
        restaurantId: id,
        userId: profile.id,
        overall,
        food: food || overall,
        beverages: beverages || overall,
        service: service || overall,
        text: text.trim() || undefined,
      });
      haptic.success();
      toast.success("Thanks for your review", "It's now visible to other diners.");
      router.back();
    } catch (e) {
      toast.error("Could not submit", (e as Error).message);
    }
  };

  return (
    <Screen className="bg-[#F6F2EC]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: T.cream, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="chevron.left" size={18} color={T.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: T.ink, letterSpacing: -0.5, fontFamily: T.fontDisp }}>
              Write a review
            </Text>
            <Text style={{ marginTop: 1, fontSize: 12, color: T.muted }}>
              Help fellow diners pick the right place
            </Text>
          </View>
        </View>

        {/* Restaurant card */}
        {restaurant ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
            <View
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                backgroundColor: "#fff", borderRadius: 16, padding: 12,
                borderWidth: 1, borderColor: T.hairline,
              }}
            >
              <Img uri={restaurant.cover_image_url} kind="restaurant" h={56} w={56} radius={12} hue={28} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: T.ink, letterSpacing: -0.2 }}>
                  {restaurant.name}
                </Text>
                <Text style={{ marginTop: 2, fontSize: 11, color: T.muted }}>
                  {restaurant.cuisines.slice(0, 3).join(" · ")}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Overall rating */}
        <View style={{ paddingHorizontal: 18, paddingTop: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.4, fontFamily: T.fontMono }}>
            OVERALL RATING
          </Text>
          <View style={{ marginTop: 14, alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => { haptic.select(); setOverall(v); }}
                  style={{
                    width: 52, height: 52, borderRadius: 14,
                    backgroundColor: overall >= v ? T.forest : T.cream,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="star.fill" size={24} color={overall >= v ? "#fff" : "#D4CFC2"} />
                </Pressable>
              ))}
            </View>
            <Text style={{ marginTop: 14, fontSize: 17, fontWeight: "700", color: T.ink, fontFamily: T.fontDisp, letterSpacing: -0.3 }}>
              {overall > 0 ? RATING_LABELS[overall - 1] : "Tap a star to rate"}
            </Text>
          </View>
        </View>

        {/* Per-axis breakdown */}
        {overall > 0 ? (
          <View style={{ paddingHorizontal: 18, paddingTop: 28 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.4, fontFamily: T.fontMono }}>
              BREAK IT DOWN (OPTIONAL)
            </Text>
            <View
              style={{
                marginTop: 12,
                backgroundColor: "#fff", borderRadius: 16,
                borderWidth: 1, borderColor: T.hairline,
              }}
            >
              <AxisRow icon="fork.knife" label="Food" value={food} onChange={setFood} first />
              <AxisRow icon="wineglass.fill" label="Beverages" value={beverages} onChange={setBeverages} />
              <AxisRow icon="sparkles" label="Service" value={service} onChange={setService} />
            </View>
          </View>
        ) : null}

        {/* Text review */}
        <View style={{ paddingHorizontal: 18, paddingTop: 28 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.4, fontFamily: T.fontMono }}>
            YOUR THOUGHTS (OPTIONAL)
          </Text>
          <View
            style={{
              marginTop: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14,
              borderWidth: 1, borderColor: T.hairline,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What did you love? What could be better?"
              placeholderTextColor={T.muted}
              multiline
              numberOfLines={6}
              style={{
                minHeight: 120, fontSize: 14, color: T.ink, lineHeight: 20,
                textAlignVertical: "top",
              }}
            />
            <Text style={{ marginTop: 8, fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
              {text.length} chars · 100 minimum recommended
            </Text>
          </View>
        </View>

        {/* Submit */}
        <View style={{ paddingHorizontal: 18, paddingTop: 28 }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || submit.isPending}
            style={{
              height: 54, borderRadius: 14,
              backgroundColor: canSubmit ? T.saffron : T.creamDeep,
              alignItems: "center", justifyContent: "center",
              flexDirection: "row", gap: 8,
              opacity: submit.isPending ? 0.6 : 1,
            }}
          >
            <Icon name="paperplane.fill" size={16} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: -0.1 }}>
              {submit.isPending ? "Submitting…" : "Submit review"}
            </Text>
          </Pressable>
          <Text style={{ marginTop: 10, fontSize: 11, color: T.muted, textAlign: "center", lineHeight: 16 }}>
            By posting, you agree to DIME's review guidelines. Reviews are public and visible to the restaurant owner.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function AxisRow({
  icon, label, value, onChange, first,
}: {
  icon: string; label: string; value: number;
  onChange: (v: number) => void; first?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderTopWidth: first ? 0 : 1, borderTopColor: T.hairline,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: T.cream, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={15} color={T.saffron} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: T.ink }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            hitSlop={6}
          >
            <Icon
              name="star.fill"
              size={18}
              color={value >= v ? T.forest : "#D4CFC2"}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
