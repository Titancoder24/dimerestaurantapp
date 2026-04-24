import { Clipboard, Share, Text, View } from "react-native";
import { Button, Header, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export default function Refer() {
  const profile = useAuth((s) => s.profile);
  const toast = useToast();
  const code = profile?.referral_code ?? "DIMEXXX";

  async function copy() {
    Clipboard.setString(code);
    haptic.success();
    toast.success("Copied!", "Share it with your friends.");
  }
  async function share() {
    try {
      await Share.share({ message: `Join me on DIME and get ₹100 off your first order. Use code ${code}. https://dime.app` });
    } catch {}
  }

  return (
    <Screen>
      <Header title="Refer & Earn" back />
      <View className="mx-4 items-center rounded-3xl bg-white border border-dime-border p-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-dime-orange-50">
          <Icon name="sparkles" size={28} color="#FC8019" />
        </View>
        <Text className="mt-3 text-[20px] font-semibold text-dime-ink">Give ₹100, get 200 points</Text>
        <Text className="mt-1 text-center text-[13px] text-dime-ink-3">
          Your friends get ₹100 off their first order. You earn 200 points when they complete it.
        </Text>

        <View className="mt-5 w-full items-center rounded-2xl border-2 border-dashed border-dime-orange-400 bg-dime-orange-50 p-4">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-dime-orange-700">Your code</Text>
          <Text className="mt-1 text-[28px] font-bold tracking-widest text-dime-ink">{code}</Text>
        </View>

        <View className="mt-5 w-full flex-row gap-2">
          <View className="flex-1">
            <Button label="Copy code" variant="secondary" onPress={copy} fullWidth />
          </View>
          <View className="flex-1">
            <Button label="Share" onPress={share} fullWidth />
          </View>
        </View>
      </View>
    </Screen>
  );
}
