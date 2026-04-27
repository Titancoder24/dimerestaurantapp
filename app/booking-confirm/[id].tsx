import { useEffect } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Icon, Screen, haptic } from "@/components/ui";

export default function BookingConfirm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    haptic.success();
  }, []);

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8 py-16">
        <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-emerald-50">
          <Icon name="checkmark.circle.fill" size={56} color="#16A34A" />
        </View>
        <Text className="text-[32px] font-bold text-dime-ink" style={{ letterSpacing: -1 }}>
          You're booked
        </Text>
        <Text className="mt-3 text-center text-[15px] text-dime-ink-3">
          We've saved your table. You'll get a reminder before your arrival.
        </Text>

        <View className="mt-10 w-full max-w-[300px] gap-3">
          <Button label="View booking" onPress={() => router.replace({ pathname: "/booking/[id]", params: { id: id! } })} fullWidth />
          <Button label="Back home" variant="ghost" onPress={() => router.replace("/home")} fullWidth />
        </View>
      </View>
    </Screen>
  );
}
