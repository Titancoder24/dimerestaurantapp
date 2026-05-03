import "../global.css";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { bootstrapAuth } from "@/store/auth";
import { ToastHost } from "@/components/ui";
import { CustomerWebShell } from "@/components/ui/CustomerWebShell";
import { useNotificationListener } from "@/hooks/useNotificationListener";
import { ensureWebFonts } from "@/lib/fonts";

ensureWebFonts();

function NotificationBridge() {
  useNotificationListener();
  return null;
}

function BrandedSplash() {
  const pulse = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <View style={{ flex: 1, backgroundColor: "#F6F2EC", alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ transform: [{ scale: pulse }], alignItems: "center" }}>
        <View style={{ height: 72, width: 72, borderRadius: 20, backgroundColor: "#FF5A1F", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 38, fontWeight: "800", color: "#fff", letterSpacing: -1.5 }}>D</Text>
        </View>
        <Text style={{ marginTop: 16, fontSize: 24, fontWeight: "800", color: "#0E0E0C", letterSpacing: 3 }}>DIME</Text>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    bootstrapAuth().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready && showSplash) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
        setShowSplash(false);
      });
    }
  }, [ready, showSplash, fadeAnim]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {ready ? (
            <>
              <NotificationBridge />
              <CustomerWebShell>
                <Slot />
              </CustomerWebShell>
              <ToastHost />
            </>
          ) : null}
          {showSplash ? (
            <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: fadeAnim, zIndex: 999 }}>
              <BrandedSplash />
            </Animated.View>
          ) : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
