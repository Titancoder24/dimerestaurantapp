import { useState } from "react";
import {
  Image,
  Text,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, Sheet, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { supabase } from "@/lib/supabase";

// Cinematic restaurant interior — warm lighting, set tables.
// Unsplash hosted, served via the picsum/unsplash CDN; comes through with
// `auto=format&fit=crop&w=1600&q=80` so the panel stays under ~250 KB.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80";

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
      else if (role === "server" || role === "host" || role === "chef" || role === "cashier") router.replace("/server/tables");
      else router.replace("/home");
    } catch (e) {
      haptic.error();
      toast.error("Sign-in failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  type DemoKind = "customer" | "owner" | "manager" | "server" | "admin";
  function fillDemo(kind: DemoKind) {
    haptic.select();
    if (kind === "customer") { setEmail("priya@dime.app"); setPassword("priya123"); }
    if (kind === "owner") { setEmail("owner@dime.app"); setPassword("owner123"); }
    if (kind === "manager") { setEmail("manager@dime.app"); setPassword("manager123"); }
    if (kind === "server") { setEmail("server@dime.app"); setPassword("server123"); }
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
            {/* Left branding panel — restaurant photo with dark overlay */}
            {wide ? (
              <View style={{ flex: 1, position: "relative", overflow: "hidden", backgroundColor: "#0E0E0C" }}>
                <Image
                  source={{ uri: HERO_IMAGE }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {/* Warm cinematic overlay so text remains crisp */}
                <LinearGradient
                  colors={["rgba(14,14,12,0.55)", "rgba(14,14,12,0.78)", "rgba(252,128,25,0.32)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Top-left status pill */}
                <View
                  style={{
                    position: "absolute", top: 32, left: 32,
                    flexDirection: "row", alignItems: "center", gap: 8,
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.14)",
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" }} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 0.4, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                    LIVE · 100+ RESTAURANTS
                  </Text>
                </View>

                {/* Bottom-left content */}
                <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 48 }}>
                  <View style={{ maxWidth: 460 }}>
                    <View
                      style={{
                        marginBottom: 22,
                        height: 56, width: 56,
                        borderRadius: 16,
                        backgroundColor: "#FC8019",
                        alignItems: "center", justifyContent: "center",
                        shadowColor: "#FC8019",
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.35, shadowRadius: 24,
                        elevation: 8,
                      }}
                    >
                      <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -1 }}>D</Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 40, fontWeight: "700", color: "#fff",
                        letterSpacing: -1.4, lineHeight: 46,
                        fontFamily: '"Fraunces", Georgia, serif',
                      }}
                    >
                      Run your restaurant{"\n"}smarter with DIME
                    </Text>
                    <Text style={{ marginTop: 14, fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.85)" }}>
                      Orders, reservations, menus, analytics, and beautiful print-ready menu designs — all in one place.
                    </Text>
                    <View style={{ marginTop: 24, flexDirection: "row", gap: 10 }}>
                      {[
                        { icon: "chart.line.uptrend.xyaxis", label: "Analytics" },
                        { icon: "fork.knife", label: "Menu" },
                        { icon: "photo.fill", label: "Creator" },
                        { icon: "calendar", label: "Bookings" },
                      ].map((f) => (
                        <View
                          key={f.label}
                          style={{
                            alignItems: "center", paddingHorizontal: 12, paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: "rgba(255,255,255,0.12)",
                            borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
                          }}
                        >
                          <Icon name={f.icon} size={16} color="#fff" />
                          <Text style={{ marginTop: 4, fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: 0.4 }}>
                            {f.label}
                          </Text>
                        </View>
                      ))}
                    </View>
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

                <View className="mt-3 items-center gap-1.5">
                  <Link href="/owner/signup" className="text-[13px] text-[#93959F]">
                    Restaurant owner?{" "}
                    <Text className="font-bold text-[#E23744]">Sign up your restaurant</Text>
                  </Link>
                  <Link href="/server/login" className="text-[12px] text-[#93959F]">
                    Server / waiter?{" "}
                    <Text className="font-bold text-[#E23744]">Staff login</Text>
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

                <View className="flex-row flex-wrap gap-2 pb-4">
                  {[
                    { kind: "customer" as const, label: "Diner", icon: "person.fill", email: "priya@dime.app", pwd: "priya123", dot: "#3358D4", meta: "Customer" },
                    { kind: "owner" as const, label: "Owner", icon: "building.2.fill", email: "owner@dime.app", pwd: "owner123", dot: "#FF5A1F", meta: "Restaurant owner" },
                    { kind: "manager" as const, label: "Manager", icon: "briefcase.fill", email: "manager@dime.app", pwd: "manager123", dot: "#6F5BFF", meta: "Mocha Cafe · PIN 1234" },
                    { kind: "server" as const, label: "Server", icon: "figure.walk", email: "server@dime.app", pwd: "server123", dot: "#0F8A4F", meta: "Mocha Cafe · PIN 5678" },
                    { kind: "admin" as const, label: "Admin", icon: "gear", email: "admin@dime.app", pwd: "admin123", dot: "#0E0E0C", meta: "Super admin" },
                  ].map((d) => (
                    <Pressable
                      key={d.kind}
                      onPress={() => fillDemo(d.kind)}
                      style={{
                        flexBasis: "48%", flexGrow: 1,
                        backgroundColor: "#fff",
                        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                        borderWidth: 1, borderColor: "#F0F0F0",
                        flexDirection: "row", alignItems: "center", gap: 10,
                      }}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8F8F8", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={d.icon} size={14} color="#535665" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: d.dot }} />
                          <Text style={{ fontSize: 12.5, fontWeight: "700", color: "#1C1C1E" }}>{d.label}</Text>
                        </View>
                        <Text numberOfLines={1} style={{ marginTop: 1, fontSize: 10, color: "#93959F" }}>
                          {d.email}
                        </Text>
                        <Text numberOfLines={1} style={{ fontSize: 10, color: "#93959F" }}>
                          {d.meta}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
                <Text style={{ fontSize: 10.5, color: "#93959F", textAlign: "center", paddingBottom: 8 }}>
                  All passwords follow the pattern <Text style={{ fontFamily: '"IBM Plex Mono", ui-monospace, monospace', color: "#535665" }}>{"<role>123"}</Text> · Manager / Server land on their own panels after sign-in
                </Text>
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
