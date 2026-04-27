import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Icon, Screen, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export default function ServerLogin() {
  const router = useRouter();
  const setStaff = useAuth((s) => s.setStaff);
  const toast = useToast();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  function press(n: string) {
    haptic.select();
    setPin((p) => (p.length >= 4 ? p : p + n));
  }
  function clear() { setPin(""); }
  function back() { setPin((p) => p.slice(0, -1)); haptic.light(); }

  async function submit() {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("staff_login_by_pin", { p_pin: pin });
      if (error) throw error;
      const row = data?.[0] as { id: string; restaurant_id: string; name: string; role: string; permissions: Record<string, boolean> } | undefined;
      if (!row) {
        haptic.error();
        toast.error("Invalid PIN");
        setPin("");
        return;
      }
      setStaff({
        id: row.id,
        restaurantId: row.restaurant_id,
        name: row.name,
        role: row.role,
        permissions: (row.permissions as Record<string, boolean>) ?? {},
      });
      haptic.success();
      router.replace("/server/tables");
    } catch (e) {
      toast.error("Login failed", (e as Error).message);
    } finally { setLoading(false); }
  }

  const keys = ["1","2","3","4","5","6","7","8","9","clear","0","back"];

  return (
    <Screen scroll={false}>
      <View className="flex-1 items-center justify-center p-6">
        <View className="mb-6 h-14 w-14 items-center justify-center rounded-2xl bg-dime-primary-500">
          <Icon name="lock.fill" size={24} color="#fff" />
        </View>
        <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Server Panel</Text>
        <Text className="mt-1 text-[13px] text-dime-ink-3">Enter your 4-digit PIN</Text>

        <View className="mt-8 flex-row gap-4">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className={`h-4 w-4 rounded-full ${pin.length > i ? "bg-dime-primary-500" : "bg-neutral-50"}`}
            />
          ))}
        </View>

        <View className="mt-10 w-full max-w-[320px] flex-row flex-wrap justify-between">
          {keys.map((k) => (
            <Pressable
              key={k}
              onPress={() => k === "clear" ? clear() : k === "back" ? back() : press(k)}
              className="m-1 h-16 w-[30%] items-center justify-center rounded-2xl bg-dime-bg-2"
            >
              {k === "clear" ? (
                <Text className="text-[13px] font-semibold text-dime-ink-2">Clear</Text>
              ) : k === "back" ? (
                <Icon name="arrow.left" size={18} color="#1C1C1E" />
              ) : (
                <Text className="text-[26px] font-semibold text-dime-ink">{k}</Text>
              )}
            </Pressable>
          ))}
        </View>

        <View className="mt-8 w-full max-w-[320px]">
          <Button label="Unlock" size="lg" loading={loading} disabled={pin.length !== 4} onPress={submit} fullWidth />
        </View>

        <Pressable onPress={() => router.replace("/")} className="mt-6">
          <Text className="text-[13px] text-dime-ink-3">Not a staff member? <Text className="font-semibold text-dime-primary-600">Back</Text></Text>
        </Pressable>
      </View>
    </Screen>
  );
}
