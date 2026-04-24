import { useState } from "react";
import { Text, View, Pressable, Image, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const toastError = useToast((s) => s.error);

  const [email, setEmail] = useState("demo@dime.app");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      toastError("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      haptic.success();
      router.replace("/");
    } catch (e) {
      haptic.error();
      toastError("Sign-in failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function useDemo(kind: "customer" | "owner" | "admin") {
    haptic.select();
    if (kind === "customer") { setEmail("priya@dime.app"); setPassword("priya123"); }
    if (kind === "owner") { setEmail("owner@dime.app"); setPassword("owner123"); }
    if (kind === "admin") { setEmail("admin@dime.app"); setPassword("admin123"); }
  }

  return (
    <SafeAreaView className="flex-1 bg-dime-bg">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6">
        <View className="flex-1 justify-center">
          <View className="mb-10">
            <View className="mb-6 h-14 w-14 items-center justify-center rounded-2xl bg-dime-orange-500">
              <Text className="text-[28px] font-bold text-white">D</Text>
            </View>
            <Text className="text-[32px] font-semibold text-dime-ink">Welcome back.</Text>
            <Text className="mt-1 text-[15px] text-dime-ink-3">Sign in to continue to DIME.</Text>
          </View>

          <View className="gap-4">
            <Input
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
            />
            <Input
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
            />
          </View>

          <View className="mt-6">
            <Button label="Sign in" size="lg" loading={loading} onPress={onSubmit} fullWidth />
          </View>

          <View className="mt-4 flex-row items-center justify-center gap-1">
            <Text className="text-[13px] text-dime-ink-3">New to DIME?</Text>
            <Link href="/signup" className="text-[13px] font-semibold text-dime-orange-600">Create an account</Link>
          </View>

          <View className="mt-3 items-center">
            <Link href={{ pathname: "/signup", params: { role: "owner" } }} className="text-[12px] font-medium text-dime-ink-3">
              Restaurant owner? <Text className="font-semibold text-dime-orange-600">Partner with DIME →</Text>
            </Link>
          </View>

          <View className="my-8 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-dime-border" />
            <Text className="text-[11px] uppercase tracking-widest text-dime-ink-3">Quick demo</Text>
            <View className="h-px flex-1 bg-dime-border" />
          </View>

          <View className="flex-row gap-2">
            <Pressable onPress={() => useDemo("customer")} className="flex-1 items-center rounded-xl border border-dime-border bg-white px-3 py-3">
              <Text className="text-[13px] font-semibold text-dime-ink">Customer</Text>
              <Text className="text-[11px] text-dime-ink-3">priya@dime.app</Text>
            </Pressable>
            <Pressable onPress={() => useDemo("owner")} className="flex-1 items-center rounded-xl border border-dime-border bg-white px-3 py-3">
              <Text className="text-[13px] font-semibold text-dime-ink">Owner</Text>
              <Text className="text-[11px] text-dime-ink-3">owner@dime.app</Text>
            </Pressable>
            <Pressable onPress={() => useDemo("admin")} className="flex-1 items-center rounded-xl border border-dime-border bg-white px-3 py-3">
              <Text className="text-[13px] font-semibold text-dime-ink">Admin</Text>
              <Text className="text-[11px] text-dime-ink-3">admin@dime.app</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
