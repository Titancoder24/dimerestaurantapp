import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, EmptyState, Header, Screen } from "@/components/ui";
import { useMyOrders } from "@/hooks/queries";
import { rupees, timeAgo } from "@/lib/format";

export default function MyOrders() {
  const router = useRouter();
  const { data } = useMyOrders();

  return (
    <Screen>
      <Header title="My Orders" back />

      {(data ?? []).length === 0 ? (
        <EmptyState
          icon="bag.fill"
          title="No orders yet"
          message="Your past and active orders show up here."
          actionLabel="Discover restaurants"
          onAction={() => router.push("/discover")}
        />
      ) : (
        <View className="px-4 gap-3">
          {(data ?? []).map((o) => {
            const toneMap: Record<string, "green" | "orange" | "gray" | "red"> = {
              paid: "gray", served: "green", ready: "orange", preparing: "orange", received: "orange", cancelled: "red",
            };
            return (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: o.id } })}
                className="flex-row gap-3 rounded-2xl border border-dime-border bg-white p-3"
              >
                <Image source={{ uri: o.restaurants.cover_image_url ?? "" }} className="h-16 w-16 rounded-xl" />
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-dime-ink">{o.restaurants.name}</Text>
                  <Text className="text-[11px] text-dime-ink-3">{o.order_number} • {timeAgo(o.created_at)}</Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Badge tone={toneMap[o.status] ?? "gray"} label={o.status.replace("_", " ")} />
                    <Text className="text-[14px] font-semibold text-dime-ink">{rupees(o.total_amount)}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
