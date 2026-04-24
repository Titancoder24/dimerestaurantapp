import "../global.css";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { bootstrapAuth } from "@/store/auth";
import { ToastHost } from "@/components/ui";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-dime-bg">
        <ActivityIndicator color="#FC8019" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Slot />
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
