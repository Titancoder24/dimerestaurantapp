import { useState } from "react";
import { Pressable, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Header, Icon, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";

type SignupRole = "customer" | "owner";

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const signUp = useAuth((s) => s.signUp);
  const refreshProfile = useAuth((s) => s.refreshProfile);
  const toastError = useToast((s) => s.error);

  const [role, setRole] = useState<SignupRole>(params.role === "owner" ? "owner" : "customer");
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
      // If user chose owner, promote their public.users row immediately.
      if (role === "owner") {
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.user) {
          await supabase.from("users").update({ role: "owner" }).eq("id", session.user.id);
          await refreshProfile();
        }
        haptic.success();
        router.replace("/owner/onboarding");
        return;
      }
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
          <Text className="mt-1 text-[15px] text-dime-ink-3">
            {role === "owner"
              ? "Welcome! After signup we'll guide you through getting your restaurant live."
              : "Discover restaurants, book tables and earn loyalty points."}
          </Text>
        </View>

        <View className="mb-5 flex-row gap-2 rounded-2xl border border-dime-border bg-white p-1">
          <RolePill label="I'm a diner" icon="person.fill" active={role === "customer"} onPress={() => setRole("customer")} />
          <RolePill label="I own a restaurant" icon="building.2.fill" active={role === "owner"} onPress={() => setRole("owner")} />
        </View>

        <View className="gap-4">
          <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Priya Sharma" />
          <Input label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@email.com" />
          <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="6+ characters" helper="At least 6 characters" />
        </View>
        <View className="mt-6">
          <Button label={role === "owner" ? "Continue to onboarding" : "Create account"} size="lg" loading={loading} onPress={onSubmit} fullWidth />
        </View>
        <View className="mt-4 flex-row items-center justify-center gap-1">
          <Text className="text-[13px] text-dime-ink-3">Already have an account?</Text>
          <Link href="/login" className="text-[13px] font-semibold text-dime-orange-600">Sign in</Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RolePill({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { haptic.select(); onPress(); }}
      className={cn(
        "flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5",
        active ? "bg-dime-orange-500" : "bg-transparent"
      )}
    >
      <Icon name={icon} size={14} color={active ? "#fff" : "#8E8E93"} />
      <Text className={cn("text-[13px] font-semibold", active ? "text-white" : "text-dime-ink-2")}>{label}</Text>
    </Pressable>
  );
}
