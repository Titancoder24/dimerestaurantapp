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
        <View className="px-5 gap-4">
          {(data ?? []).map((o) => {
            const toneMap: Record<string, "green" | "orange" | "gray" | "red"> = {
              paid: "gray", served: "green", ready: "orange", preparing: "orange", received: "orange", cancelled: "red",
            };
            return (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: "/order/[id]", params: { id: o.id } })}
                className="flex-row gap-4 rounded-2xl bg-white p-4"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
              >
                <Image source={{ uri: o.restaurants.cover_image_url ?? "" }} className="h-[72px] w-[72px] rounded-xl" resizeMode="cover" />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-dime-ink">{o.restaurants.name}</Text>
                  <Text className="mt-0.5 text-[12px] text-dime-ink-4">{o.order_number} · {timeAgo(o.created_at)}</Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Badge tone={toneMap[o.status] ?? "gray"} label={o.status.replace("_", " ")} />
                    <Text className="text-[15px] font-bold text-dime-ink">{rupees(o.total_amount)}</Text>
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
