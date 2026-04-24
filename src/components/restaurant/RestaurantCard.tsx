import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { type Tables } from "@/lib/supabase";
import { Icon, haptic } from "@/components/ui";

export function RestaurantCard({
  restaurant,
  variant = "grid",
}: {
  restaurant: Tables<"restaurants">;
  variant?: "grid" | "horizontal" | "compact";
}) {
  const router = useRouter();
  const onPress = () => {
    haptic.light();
    router.push({ pathname: "/restaurant/[id]", params: { id: restaurant.id } });
  };

  const priceSymbols = "₹".repeat(restaurant.price_range);

  if (variant === "compact") {
    return (
      <Pressable onPress={onPress} className="mr-3 w-40">
        <View className="overflow-hidden rounded-2xl">
          <Image source={{ uri: restaurant.cover_image_url ?? "" }} className="h-28 w-40" />
        </View>
        <Text numberOfLines={1} className="mt-2 text-[14px] font-semibold text-dime-ink">{restaurant.name}</Text>
        <Text numberOfLines={1} className="text-[12px] text-dime-ink-3">{restaurant.cuisines.slice(0, 2).join(" • ")}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={variant === "horizontal" ? "mr-3 w-72" : "flex-1"}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
    >
      <View className="overflow-hidden rounded-2xl bg-white border border-dime-border">
        <View className="relative">
          <Image source={{ uri: restaurant.cover_image_url ?? "" }} className="h-36 w-full" />
          {restaurant.featured ? (
            <View className="absolute left-2 top-2 rounded-md bg-dime-orange-500 px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-white">Featured</Text>
            </View>
          ) : null}
        </View>
        <View className="p-3">
          <Text numberOfLines={1} className="text-[15px] font-semibold text-dime-ink">{restaurant.name}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-[12px] text-dime-ink-3">{restaurant.cuisines.slice(0, 3).join(" • ")}</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5">
              <Icon name="star.fill" size={11} color="#22C55E" />
              <Text className="text-[12px] font-semibold text-green-700">{Number(restaurant.rating).toFixed(1)}</Text>
            </View>
            <Text className="text-[12px] text-dime-ink-3">{priceSymbols}</Text>
            <Text className="text-[12px] text-dime-ink-3">•</Text>
            <Text numberOfLines={1} className="flex-1 text-[12px] text-dime-ink-3">{restaurant.city}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
