import { useState } from "react";
import {
  Text,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, Sheet, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const toast = useToast();
  const { width } = useWindowDimensions();
  const wide = width >= 800;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      toast.error("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      haptic.success();
      const role = useAuth.getState().profile?.role;
      if (role === "super_admin") router.replace("/admin/dashboard");
      else if (role === "owner" || role === "manager") router.replace("/owner/dashboard");
      else router.replace("/home");
    } catch (e) {
      haptic.error();
      toast.error("Sign-in failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(kind: "customer" | "owner" | "admin") {
    haptic.select();
    if (kind === "customer") { setEmail("priya@dime.app"); setPassword("priya123"); }
    if (kind === "owner") { setEmail("owner@dime.app"); setPassword("owner123"); }
    if (kind === "admin") { setEmail("admin@dime.app"); setPassword("admin123"); }
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
            {/* Left branding panel */}
            {wide ? (
              <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#FC8019" }}>
                <View className="max-w-[380px]">
                  <View className="mb-8 h-16 w-16 items-center justify-center rounded-[20px] bg-white">
                    <Text className="text-[32px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -1 }}>D</Text>
                  </View>
                  <Text className="text-[36px] font-bold text-white" style={{ letterSpacing: -1 }}>
                    Run your restaurant{"\n"}smarter with DIME
                  </Text>
                  <Text className="mt-4 text-[15px] leading-6 text-white/70">
                    Orders, reservations, menus, analytics, and beautiful print-ready menu designs — all in one place.
                  </Text>
                  <View className="mt-8 flex-row gap-3">
                    {[
                      { icon: "chart.line.uptrend.xyaxis", label: "Analytics" },
                      { icon: "fork.knife", label: "Menu" },
                      { icon: "photo.fill", label: "Creator" },
                      { icon: "calendar", label: "Bookings" },
                    ].map((f) => (
                      <View key={f.label} className="items-center rounded-[12px] bg-white/15 px-4 py-3">
                        <Icon name={f.icon} size={16} color="#fff" />
                        <Text className="mt-1 text-[10px] font-bold text-white/80">{f.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {/* Form */}
            <View className={`flex-1 justify-center px-6 py-10 ${wide ? "px-16" : ""}`}>
              <View style={{ maxWidth: 420, width: "100%", alignSelf: "center" }}>
                {!wide ? (
                  <View className="mb-8">
                    <View className="mb-5 h-14 w-14 items-center justify-center rounded-[18px]" style={{ backgroundColor: "#FC8019" }}>
                      <Text className="text-[28px] font-bold text-white" style={{ letterSpacing: -1 }}>D</Text>
                    </View>
                    <Text className="text-[28px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.8 }}>
                      Welcome back
                    </Text>
                    <Text className="mt-1.5 text-[15px] text-[#93959F]">
                      Sign in to your DIME account
                    </Text>
                  </View>
                ) : (
                  <View className="mb-10">
                    <Text className="text-[28px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.8 }}>
                      Sign in
                    </Text>
                    <Text className="mt-1.5 text-[15px] text-[#93959F]">
                      Enter your credentials to continue
                    </Text>
                  </View>
                )}

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
                  <View>
                    <Input
                      label="Password"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                    />
                    <Pressable onPress={() => setShowForgot(true)} className="mt-1.5 self-end">
                      <Text className="text-[12px] font-bold text-[#E23744]">Forgot password?</Text>
                    </Pressable>
                  </View>
                </View>

                <View className="mt-6">
                  <Button label="Sign in" size="lg" loading={loading} onPress={onSubmit} fullWidth />
                </View>

                <View className="mt-5 flex-row items-center justify-center gap-1">
                  <Text className="text-[14px] text-[#93959F]">New to DIME?</Text>
                  <Link href="/signup" className="text-[14px] font-bold text-[#E23744]">
                    Create an account
                  </Link>
                </View>

                <View className="mt-2 items-center">
                  <Link href={{ pathname: "/signup", params: { role: "owner" } }} className="text-[13px] text-[#93959F]">
                    Restaurant owner?{" "}
                    <Text className="font-bold text-[#E23744]">Partner with DIME</Text>
                  </Link>
                </View>

                {/* Demo shortcuts */}
                <View className="mb-4 mt-8 flex-row items-center gap-4">
                  <View className="h-px flex-1 bg-[#F0F0F0]" />
                  <Text className="text-[10px] font-bold uppercase text-[#93959F]" style={{ letterSpacing: 1.5 }}>
                    Quick demo
                  </Text>
                  <View className="h-px flex-1 bg-[#F0F0F0]" />
                </View>

                <View className="flex-row gap-2.5 pb-4">
                  {[
                    { kind: "customer" as const, label: "Customer", icon: "person.fill", sub: "priya@dime.app" },
                    { kind: "owner" as const, label: "Owner", icon: "building.2.fill", sub: "owner@dime.app" },
                    { kind: "admin" as const, label: "Admin", icon: "gear", sub: "admin@dime.app" },
                  ].map((d) => (
                    <Pressable
                      key={d.kind}
                      onPress={() => fillDemo(d.kind)}
                      className="flex-1 items-center rounded-[14px] bg-white px-3 py-3.5"
                      style={{ borderWidth: 1, borderColor: "#F0F0F0" }}
                    >
                      <View className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-[#F8F8F8]">
                        <Icon name={d.icon} size={14} color="#535665" />
                      </View>
                      <Text className="text-[13px] font-bold text-[#1C1C1E]">{d.label}</Text>
                      <Text className="mt-0.5 text-[10px] text-[#93959F]">{d.sub}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordSheet visible={showForgot} onClose={() => setShowForgot(false)} />
    </SafeAreaView>
  );
}

function ForgotPasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  async function handleReset() {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${Platform.OS === "web" ? window.location.origin : ""}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      haptic.success();
    } catch (e) {
      haptic.error();
      toast.error("Failed to send reset email", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={() => { onClose(); setSent(false); setEmail(""); }}>
      <Sheet.Body>
        {sent ? (
          <View className="items-center py-6">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9]">
              <Icon name="checkmark.circle.fill" size={28} color="#267E3E" />
            </View>
            <Text className="text-[18px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.5 }}>Check your email</Text>
            <Text className="mt-2 text-center text-[13px] text-[#93959F]">
              We sent a password reset link to {email}. Check your inbox and follow the link to reset your password.
            </Text>
            <View className="mt-6 w-full">
              <Button label="Done" onPress={() => { onClose(); setSent(false); setEmail(""); }} fullWidth />
            </View>
          </View>
        ) : (
          <>
            <Text className="text-[18px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.5 }}>Reset password</Text>
            <Text className="mt-1 text-[13px] text-[#93959F]">
              Enter your email and we'll send you a link to reset your password.
            </Text>
            <View className="mt-4">
              <Input
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
              />
            </View>
            <View className="mt-5">
              <Button label="Send reset link" loading={loading} onPress={handleReset} fullWidth />
            </View>
          </>
        )}
      </Sheet.Body>
    </Sheet>
  );
}
