import { useState } from "react";
import { Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Header, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuth((s) => s.signUp);
  const toastError = useToast((s) => s.error);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (name.trim().length < 2) return toastError("Enter your name");
    if (!email.includes("@")) return toastError("Enter a valid email");
    if (password.length < 6) return toastError("Password must be 6+ characters");
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      haptic.success();
      router.replace("/");
    } catch (e) {
      haptic.error();
      toastError("Signup failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-dime-bg">
      <Header back />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6">
        <View className="mb-6">
          <Text className="text-[32px] font-semibold text-dime-ink">Create your account</Text>
          <Text className="mt-1 text-[15px] text-dime-ink-3">Discover restaurants, book tables and earn loyalty points.</Text>
        </View>
        <View className="gap-4">
          <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Priya Sharma" />
          <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@email.com" />
          <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="6+ characters" helper="At least 6 characters" />
        </View>
        <View className="mt-6">
          <Button label="Create account" size="lg" loading={loading} onPress={onSubmit} fullWidth />
        </View>
        <View className="mt-4 flex-row items-center justify-center gap-1">
          <Text className="text-[13px] text-dime-ink-3">Already have an account?</Text>
          <Link href="/login" className="text-[13px] font-semibold text-dime-orange-600">Sign in</Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
