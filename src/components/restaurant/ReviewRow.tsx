import { Image, ScrollView, Text, View, useColorScheme } from "react-native";
import { Avatar, Icon } from "@/components/ui";
import type { Tables } from "@/lib/supabase";
import { surface } from "@/lib/visual";
import { timeAgo } from "@/lib/format";

type Review = Tables<"reviews"> & {
  users?: { name: string | null; avatar_url: string | null } | null;
};

export function ReviewRow({ review }: { review: Review }) {
  const scheme = useColorScheme();
  const cardBg = scheme === "light" ? "#FFFFFF" : "#1C1C1E";
  const border = scheme === "light" ? surface.hairlineLight : surface.hairlineDark;

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={review.users?.name ?? null} uri={review.users?.avatar_url ?? null} size={36} />
        <View style={{ flex: 1 }}>
          <Text className="text-dime-ink" style={{ fontSize: 14, fontWeight: "600" }}>
            {review.users?.name ?? "Diner"}
          </Text>
          <Text className="text-dime-ink-3" style={{ fontSize: 11 }}>
            {timeAgo(review.created_at)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#16A34A",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Icon name="star.fill" size={11} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
            {Number(review.overall_rating).toFixed(1)}
          </Text>
        </View>
      </View>

      {review.text ? (
        <Text
          className="text-dime-ink-2"
          style={{ marginTop: 10, fontSize: 13, lineHeight: 20 }}
        >
          {review.text}
        </Text>
      ) : null}

      {review.photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {review.photos.map((p, i) => (
            <Image
              key={i}
              source={{ uri: p }}
              style={{ width: 96, height: 96, borderRadius: 12 }}
            />
          ))}
        </ScrollView>
      ) : null}

      {review.reply_text ? (
        <View
          style={{
            marginTop: 10,
            borderRadius: 12,
            backgroundColor: scheme === "light" ? "#F7F7F7" : "rgba(255,255,255,0.06)",
            padding: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "#FC8019",
            }}
          >
            Owner reply
          </Text>
          <Text className="text-dime-ink-2" style={{ marginTop: 2, fontSize: 13 }}>
            {review.reply_text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
