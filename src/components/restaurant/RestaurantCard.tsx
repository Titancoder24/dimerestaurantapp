import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

  const rating = Number(restaurant.rating).toFixed(1);
  const ratingNum = Number(restaurant.rating);
  const ratingBg = ratingNum >= 4 ? "#267E3E" : ratingNum >= 3 ? "#DB7C38" : "#E23744";

  if (variant === "compact") {
    return (
      <Pressable onPress={onPress} className="mr-3 w-[150px]">
        <View className="overflow-hidden rounded-[14px]" style={{ borderWidth: 1, borderColor: "#F0F0F0" }}>
          <Image source={{ uri: restaurant.cover_image_url ?? "" }} className="h-[110px] w-[150px]" resizeMode="cover" />
          {ratingNum > 0 ? (
            <View className="absolute right-2 top-2 flex-row items-center gap-0.5 rounded-[4px] px-1.5 py-0.5" style={{ backgroundColor: ratingBg }}>
              <Text className="text-[10px] font-bold text-white">{rating}</Text>
              <Icon name="star.fill" size={7} color="#fff" />
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="mt-1.5 text-[13px] font-bold text-[#1C1C1E]">{restaurant.name}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-[11px] text-[#93959F]">{restaurant.cuisines.slice(0, 2).join(", ")}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={variant === "horizontal" ? "mr-3.5 w-[280px]" : "flex-1"}
      style={({ pressed }) => (pressed ? { opacity: 0.97 } : undefined)}
    >
      <View className="overflow-hidden rounded-[18px] bg-white" style={{ borderWidth: 1, borderColor: "#F0F0F0" }}>
        <View className="relative">
          <Image source={{ uri: restaurant.cover_image_url ?? "" }} className="h-[170px] w-full" resizeMode="cover" />

          {restaurant.price_range <= 2 ? (
            <View className="absolute inset-x-0 bottom-0">
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} className="px-3 pb-2.5 pt-6">
                <Text className="text-[14px] font-extrabold text-white" style={{ letterSpacing: -0.3 }}>
                  FLAT ₹100 OFF
                </Text>
                <Text className="text-[10px] font-medium text-white/70">ABOVE ₹249</Text>
              </LinearGradient>
            </View>
          ) : restaurant.featured ? (
            <View className="absolute inset-x-0 bottom-0">
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)"]} className="px-3 pb-2.5 pt-6">
                <View className="flex-row items-center gap-1">
                  <Icon name="star.fill" size={9} color="#FFD700" />
                  <Text className="text-[12px] font-extrabold text-white" style={{ letterSpacing: 0.5 }}>
                    PROMOTED
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ) : null}
        </View>

        <View className="px-3 py-2.5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text numberOfLines={1} className="text-[15px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.2 }}>
                {restaurant.name}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#93959F]">
                {restaurant.cuisines.slice(0, 3).join(", ")}
              </Text>
            </View>
            {ratingNum > 0 ? (
              <View className="flex-row items-center gap-0.5 rounded-[5px] px-1.5 py-1" style={{ backgroundColor: ratingBg }}>
                <Text className="text-[12px] font-bold text-white">{rating}</Text>
                <Icon name="star.fill" size={8} color="#fff" />
              </View>
            ) : null}
          </View>

          <View className="mt-1.5 flex-row items-center">
            <Icon name="mappin" size={10} color="#93959F" />
            <Text className="ml-1 text-[11px] text-[#93959F]">{restaurant.city}</Text>
            <Text className="mx-1.5 text-[11px] text-[#D4D4D8]">•</Text>
            <Text className="text-[11px] text-[#93959F]">{"₹".repeat(restaurant.price_range)} for one</Text>
            <Text className="mx-1.5 text-[11px] text-[#D4D4D8]">•</Text>
            <Text className="text-[11px] text-[#93959F]">30 min</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
