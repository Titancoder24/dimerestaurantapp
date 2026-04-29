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
        <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-orange-50">
          <Icon name="clock.fill" size={56} color="#FF6B2C" />
        </View>
        <Text className="text-[32px] font-bold text-dime-ink" style={{ letterSpacing: -1 }}>
          Booking requested
        </Text>
        <Text className="mt-3 text-center text-[15px] text-dime-ink-3">
          The restaurant will review your reservation and confirm shortly. You'll get a notification once they respond.
        </Text>

        <View className="mt-10 w-full max-w-[300px] gap-3">
          <Button label="View booking" onPress={() => router.replace({ pathname: "/booking/[id]", params: { id: id! } })} fullWidth />
          <Button label="Back home" variant="ghost" onPress={() => router.replace("/home")} fullWidth />
        </View>
      </View>
    </Screen>
  );
}
