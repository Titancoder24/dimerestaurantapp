// Restaurant-owner / manager sign-in. Branded distinctly from the customer app.
import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, useWindowDimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { T } from "@/lib/visual";

export default function OwnerLogin() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const toast = useToast();
  const { width } = useWindowDimensions();
  const wide = width >= 880;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      const role = useAuth.getState().profile?.role;
      haptic.success();
      if (role === "super_admin") router.replace("/admin/dashboard");
      else if (role === "owner" || role === "manager") router.replace("/owner/dashboard");
      else if (role === "server" || role === "host" || role === "chef" || role === "cashier") router.replace("/server/tables");
      else {
        toast.error("Restaurant accounts only", "This portal is for owners, managers and staff.");
      }
    } catch (e) {
      haptic.error();
      toast.error("Sign-in failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
            {wide ? (
              <View style={{ flex: 1, padding: 48, justifyContent: "space-between", backgroundColor: "#0E0E0C" }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "#FF5A1F", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.6 }}>D</Text>
                    </View>
                    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.6, fontFamily: T.fontDisp }}>
                      DIME for Restaurants
                    </Text>
                  </View>
                  <Text style={{ marginTop: 56, fontSize: 36, fontWeight: "700", color: "#fff", letterSpacing: -1, lineHeight: 42, fontFamily: T.fontDisp }}>
                    The pass bell{"\n"}is ringing.{"\n"}Service is on.
                  </Text>
                  <Text style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.78)", lineHeight: 22, maxWidth: 400 }}>
                    Sign in to pick up where the floor left off — live tickets, tonight's covers, the diner asking if Table 7 can sit at 9 — already pulled into one calm dashboard.
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" }} />
                    <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: T.fontMono, letterSpacing: 0.4 }}>
                      LIVE · KITCHEN, BOOKINGS & CHAT IN SYNC
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    100+ kitchens already on the rail across India.
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={{ flex: 1, padding: wide ? 48 : 24, justifyContent: "center", maxWidth: 460, alignSelf: "center", width: "100%" }}>
              {!wide ? (
                <View style={{ marginBottom: 22, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "#FF5A1F", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.6 }}>D</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", letterSpacing: -0.5, color: "#0E0E0C", fontFamily: T.fontDisp }}>
                    DIME for Restaurants
                  </Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.4, fontFamily: T.fontMono }}>
                RESTAURANT WORKSPACE
              </Text>
              <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "700", color: "#0E0E0C", letterSpacing: -0.8, fontFamily: T.fontDisp }}>
                Sign in
              </Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: T.muted }}>
                Owners, managers and staff with restaurant access.
              </Text>

              <View style={{ marginTop: 22, gap: 14 }}>
                <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
                <Button label={busy ? "Signing in…" : "Sign in"} loading={busy} onPress={submit} fullWidth />
              </View>

              <View style={{ marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#ECECEC", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 13, color: T.muted }}>New to DIME?</Text>
                  <Link href="/owner/signup" style={{ fontSize: 13, color: "#FF5A1F", fontWeight: "700" }}>
                    Create restaurant account
                  </Link>
                </View>
                <Pressable
                  onPress={() => router.push("/server/login")}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 8, paddingVertical: 12, borderRadius: 10,
                    borderWidth: 1, borderColor: "#ECECEC",
                    backgroundColor: "#fff",
                  }}
                >
                  <Icon name="figure.walk" size={14} color="#0F8A4F" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0E0E0C" }}>I'm a server / waiter</Text>
                  <Icon name="arrow.right" size={12} color={T.muted} />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/login")}
                  style={{ alignSelf: "center", paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 12, color: T.muted }}>
                    Looking to dine? <Text style={{ color: "#0E0E0C", fontWeight: "700" }}>Diner sign in</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
