import { Text, View } from "react-native";
import { Avatar, Icon } from "@/components/ui";
import { surface } from "@/lib/visual";
import { timeAgo } from "@/lib/format";
import type { Tables } from "@/lib/supabase";

export type ReviewRowData = Tables<"reviews"> & {
  users: { name: string | null; avatar_url: string | null };
};

type Props = {
  review: ReviewRowData;
  compact?: boolean;
};

export function ReviewRow({ review, compact }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: surface.hairline,
        width: compact ? 280 : undefined,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={review.users?.name} uri={review.users?.avatar_url} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: surface.ink }}>
            {review.users?.name ?? "Diner"}
          </Text>
          <Text style={{ fontSize: 11, color: surface.ink3 }}>{timeAgo(review.created_at)}</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: "#1E7A3A",
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 3,
          }}
        >
          <Icon name="star.fill" size={9} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{review.overall_rating}.0</Text>
        </View>
      </View>
      {review.text ? (
        <Text
          numberOfLines={compact ? 4 : undefined}
          style={{ marginTop: 10, fontSize: 13, lineHeight: 18, color: surface.ink2 }}
        >
          {review.text}
        </Text>
      ) : null}
    </View>
  );
}
