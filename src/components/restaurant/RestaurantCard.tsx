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

  const priceSymbols = "₹".repeat(restaurant.price_range);

  if (variant === "compact") {
    return (
      <Pressable onPress={onPress} className="mr-3 w-44">
        <View className="overflow-hidden rounded-2xl">
          <Image source={{ uri: restaurant.cover_image_url ?? "" }} className="h-32 w-44" resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)"]}
            className="absolute inset-x-0 bottom-0 h-16 justify-end p-3"
          >
            <Text numberOfLines={1} className="text-[14px] font-bold text-white">{restaurant.name}</Text>
          </LinearGradient>
        </View>
        <Text numberOfLines={1} className="mt-2 text-[12px] text-dime-ink-3">
          {restaurant.cuisines.slice(0, 2).join(" · ")}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={variant === "horizontal" ? "mr-4 w-[300px]" : "flex-1"}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.98 }] } : undefined)}
    >
      <View
        className="overflow-hidden rounded-2xl bg-white"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 }}
      >
        <View className="relative">
          <Image source={{ uri: restaurant.cover_image_url ?? "" }} className="h-44 w-full" resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            className="absolute inset-x-0 bottom-0 h-24 justify-end px-4 pb-3"
          >
            <Text numberOfLines={1} className="text-[18px] font-bold text-white" style={{ letterSpacing: -0.3 }}>
              {restaurant.name}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[12px] text-white/80">
              {restaurant.cuisines.slice(0, 3).join(" · ")}
            </Text>
          </LinearGradient>
          {restaurant.featured ? (
            <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-dime-gold px-2.5 py-1">
              <Icon name="star.fill" size={10} color="#fff" />
              <Text className="text-[10px] font-bold uppercase text-white" style={{ letterSpacing: 0.8 }}>
                Featured
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center gap-3 px-4 py-3">
          <View className="flex-row items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1">
            <Icon name="star.fill" size={12} color="#16A34A" />
            <Text className="text-[13px] font-bold text-emerald-700">
              {Number(restaurant.rating).toFixed(1)}
            </Text>
          </View>
          <Text className="text-[13px] font-medium text-dime-ink-3">{priceSymbols}</Text>
          <View className="h-1 w-1 rounded-full bg-dime-ink-4" />
          <Text numberOfLines={1} className="flex-1 text-[13px] text-dime-ink-3">
            {restaurant.city}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
