import { Clipboard, Share, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      <View className="mx-5 items-center overflow-hidden rounded-[22px]" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 5 }}>
        <LinearGradient
          colors={["#1A1A1A", "#2D2D2D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full items-center p-8"
        >
          <View className="h-16 w-16 items-center justify-center rounded-full bg-dime-gold/20">
            <Icon name="sparkles" size={28} color="#C9A96E" />
          </View>
          <Text className="mt-4 text-[24px] font-bold text-white" style={{ letterSpacing: -0.5 }}>
            Give ₹100, get 200 points
          </Text>
          <Text className="mt-2 text-center text-[14px] text-white/50">
            Your friends get ₹100 off their first order. You earn 200 points when they complete it.
          </Text>

          <View className="mt-6 w-full items-center rounded-2xl bg-white/10 p-5">
            <Text className="text-[10px] font-bold uppercase text-dime-gold" style={{ letterSpacing: 2 }}>Your code</Text>
            <Text className="mt-2 text-[32px] font-bold text-white" style={{ letterSpacing: 4 }}>{code}</Text>
          </View>

          <View className="mt-6 w-full flex-row gap-3">
            <View className="flex-1">
              <Button label="Copy code" variant="secondary" onPress={copy} fullWidth />
            </View>
            <View className="flex-1">
              <Button label="Share" onPress={share} fullWidth />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Screen>
  );
}
