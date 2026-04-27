import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast, type ToastKind } from "@/store/toast";
import { Icon } from "./Icon";

const tones: Record<ToastKind, { bg: string; icon: string; color: string }> = {
  success: { bg: "bg-emerald-500", icon: "checkmark.circle.fill", color: "#fff" },
  error: { bg: "bg-dime-danger", icon: "exclamationmark.triangle.fill", color: "#fff" },
  warn: { bg: "bg-amber-500", icon: "exclamationmark.triangle.fill", color: "#fff" },
  info: { bg: "bg-blue-500", icon: "info.circle", color: "#fff" },
};

export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <SafeAreaView edges={["top"]} pointerEvents="box-none" className="absolute inset-x-0 top-0 z-50 items-center">
      <View className="w-full max-w-[480px] px-4 pt-2">
        {toasts.map((t) => {
          const tone = tones[t.kind];
          return (
            <Animated.View key={t.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)} layout={Layout.springify()}>
              <Pressable onPress={() => dismiss(t.id)} className={`mb-2 flex-row items-center gap-2 rounded-2xl px-4 py-3 ${tone.bg}`}>
                <Icon name={tone.icon} size={20} color={tone.color} />
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-white">{t.title}</Text>
                  {t.message ? <Text className="text-[12px] text-white/90">{t.message}</Text> : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
