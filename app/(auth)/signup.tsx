import { useState } from "react";
import {
  Pressable,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, haptic } from "@/components/ui";
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
  const toast = useToast();
  const { width } = useWindowDimensions();
  const wide = width >= 800;

  const [role, setRole] = useState<SignupRole>(params.role === "owner" ? "owner" : "customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (name.trim().length < 2) return toast.error("Enter your name");
    if (!email.includes("@")) return toast.error("Enter a valid email");
    if (password.length < 6) return toast.error("Password must be 6+ characters");
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), role === "owner" ? "owner" : undefined);

      const session = useAuth.getState().session;
      if (!session) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await refreshProfile();
      }

      if (role === "owner") {
        const uid = useAuth.getState().authUser?.id;
        if (uid) {
          await supabase.from("users").update({ role: "owner" }).eq("id", uid);
          await refreshProfile();
        }
        haptic.success();
        router.replace("/owner/onboarding");
        return;
      }
      haptic.success();
      router.replace("/home");
    } catch (e) {
      haptic.error();
      toast.error("Signup failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={`flex-1 ${wide ? "flex-row" : ""}`}>
            {/* Left branding panel (wide only) */}
            {wide ? (
              <View className="flex-1 items-center justify-center bg-dime-ink px-12">
                <View className="max-w-[380px]">
                  <View className="mb-8 h-16 w-16 items-center justify-center rounded-[20px] bg-white">
                    <Text className="text-[32px] font-bold text-dime-ink" style={{ letterSpacing: -1 }}>D</Text>
                  </View>
                  <Text className="text-[40px] font-bold text-white" style={{ letterSpacing: -1.5 }}>
                    {role === "owner"
                      ? "Get your restaurant\non DIME"
                      : "Discover amazing\nrestaurants"}
                  </Text>
                  <Text className="mt-4 text-[16px] leading-6 text-white/60">
                    {role === "owner"
                      ? "Accept reservations, manage orders, design beautiful menus, and grow your business."
                      : "Find restaurants, book tables, order food, and earn rewards — all in one app."}
                  </Text>
                  {role === "owner" ? (
                    <View className="mt-8 gap-3">
                      {[
                        { icon: "chart.line.uptrend.xyaxis", text: "Real-time analytics & revenue insights" },
                        { icon: "photo.fill", text: "Beautiful menu creator with 17+ templates" },
                        { icon: "calendar", text: "Table bookings & floor management" },
                        { icon: "flame.fill", text: "Live kitchen display system" },
                      ].map((f) => (
                        <View key={f.text} className="flex-row items-center gap-3">
                          <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                            <Icon name={f.icon} size={14} color="#FF6B2C" />
                          </View>
                          <Text className="flex-1 text-[13px] text-white/80">{f.text}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Form */}
            <View className={`flex-1 justify-center px-6 py-10 ${wide ? "px-16" : ""}`}>
              <View style={{ maxWidth: 420, width: "100%", alignSelf: "center" }}>
                {!wide ? (
                  <View className="mb-8">
                    <View className="mb-5 h-14 w-14 items-center justify-center rounded-[18px] bg-dime-ink">
                      <Text className="text-[28px] font-bold text-white" style={{ letterSpacing: -1 }}>D</Text>
                    </View>
                    <Text className="text-[32px] font-bold text-dime-ink" style={{ letterSpacing: -1 }}>
                      {role === "owner" ? "Partner with DIME" : "Join DIME"}
                    </Text>
                    <Text className="mt-2 text-[15px] text-dime-ink-3">
                      {role === "owner"
                        ? "Get your restaurant live and start accepting reservations."
                        : "Discover restaurants, book tables and earn rewards."}
                    </Text>
                  </View>
                ) : (
                  <View className="mb-10">
                    <Text className="text-[32px] font-bold text-dime-ink" style={{ letterSpacing: -1 }}>
                      Create account
                    </Text>
                    <Text className="mt-2 text-[15px] text-dime-ink-3">
                      {role === "owner"
                        ? "Set up your restaurant account to get started."
                        : "Sign up to discover restaurants near you."}
                    </Text>
                  </View>
                )}

                {/* Role picker */}
                <View className="mb-6 flex-row gap-2 overflow-hidden rounded-2xl bg-dime-bg-2 p-1.5">
                  <RolePill
                    label="I'm a diner"
                    icon="person.fill"
                    active={role === "customer"}
                    onPress={() => setRole("customer")}
                  />
                  <RolePill
                    label="Restaurant owner"
                    icon="building.2.fill"
                    active={role === "owner"}
                    onPress={() => setRole("owner")}
                  />
                </View>

                {/* Inputs */}
                <View className="gap-4">
                  <Input
                    label="Full name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Priya Sharma"
                    autoComplete="name"
                  />
                  <Input
                    label="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@email.com"
                  />
                  <Input
                    label="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholder="6+ characters"
                    helper="At least 6 characters"
                  />
                </View>

                <View className="mt-6">
                  <Button
                    label={role === "owner" ? "Continue to onboarding" : "Create account"}
                    size="lg"
                    loading={loading}
                    onPress={onSubmit}
                    fullWidth
                  />
                </View>

                <Text className="mt-4 text-center text-[11px] text-dime-ink-4">
                  By creating an account you agree to DIME's Terms of Service and Privacy Policy.
                </Text>

                <View className="mt-5 flex-row items-center justify-center gap-1">
                  <Text className="text-[14px] text-dime-ink-3">Already have an account?</Text>
                  <Link href="/login" className="text-[14px] font-bold text-dime-primary-500">
                    Sign in
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RolePill({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => { haptic.select(); onPress(); }}
      className={cn(
        "flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3",
        active ? "bg-dime-ink" : "bg-transparent",
      )}
      style={active ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 } : undefined}
    >
      <Icon name={icon} size={14} color={active ? "#fff" : "#8A8A8A"} />
      <Text className={cn("text-[13px] font-bold", active ? "text-white" : "text-dime-ink-3")}>
        {label}
      </Text>
    </Pressable>
  );
}
