// Restaurant-owner onboarding — single seamless flow.
// Email + password + restaurant details → atomic auth + restaurant creation.
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { bootstrapAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { T } from "@/lib/visual";

export default function OwnerSignup() {
  const router = useRouter();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const wide = width >= 880;

  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!restaurantName.trim() || !ownerName.trim() || !email.trim() || !password) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be 6+ characters");
      return;
    }
    setBusy(true);
    try {
      // 1. Auth signup
      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: ownerName.trim(), phone: phone.trim() } },
      });
      if (signUpErr) {
        // If account exists, fall back to sign-in
        if (signUpErr.message?.toLowerCase().includes("already")) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (signInErr) throw new Error("That email is already registered with a different password.");
        } else {
          throw signUpErr;
        }
      } else if (!signUp.session) {
        // Email confirmation required — sign in directly so the rest of the flow proceeds
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInErr) throw new Error("Account created. Check your email to confirm, then sign in.");
      }

      // 2. Atomic role + restaurant creation
      const { data: rpc, error: rpcErr } = await supabase.rpc("create_owner_account", {
        p_owner_name: ownerName.trim(),
        p_phone: phone.trim(),
        p_restaurant_name: restaurantName.trim(),
        p_city: city.trim() || "Bangalore",
        p_address: null,
      });
      if (rpcErr) throw rpcErr;

      // 3. Refresh local profile + redirect
      await bootstrapAuth();
      haptic.success();
      toast.success("Welcome to DIME!", `${restaurantName} is being reviewed by our team.`);
      const restaurantId = (rpc as { restaurant_id?: string } | null)?.restaurant_id;
      if (restaurantId) {
        router.replace("/owner/dashboard");
      } else {
        router.replace("/owner/dashboard");
      }
    } catch (e) {
      haptic.error();
      toast.error("Could not create account", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, flexDirection: wide ? "row" : "column" }}>
            {/* Brand panel */}
            {wide ? (
              <View
                style={{
                  flex: 1, padding: 48, justifyContent: "space-between",
                  backgroundColor: "#0E0E0C",
                }}
              >
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "#FF5A1F", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.6 }}>D</Text>
                    </View>
                    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.6, fontFamily: T.fontDisp }}>
                      DIME for Restaurants
                    </Text>
                  </View>
                  <Text style={{ marginTop: 56, fontSize: 38, fontWeight: "700", color: "#fff", letterSpacing: -1.2, lineHeight: 44, fontFamily: T.fontDisp }}>
                    Spend the evening{"\n"}tasting the soup —{"\n"}not chasing it on{"\n"}WhatsApp.
                  </Text>
                  <Text style={{ marginTop: 18, fontSize: 14, color: "rgba(255,255,255,0.78)", lineHeight: 22, maxWidth: 440 }}>
                    DIME is one workspace for everything that happens after the front door — orders, bookings, kitchen, recipes, vendors, even the diner chat. Built for restaurants that care more about the table than the spreadsheet.
                  </Text>
                  <View style={{ marginTop: 28, gap: 12 }}>
                    {[
                      { strong: "Live orders & KDS", rest: "on any tablet your line cooks already use." },
                      { strong: "Bookings with pre-order", rest: "— the kitchen fires before they sit." },
                      { strong: "Diner chat", rest: "lands in the same inbox as DIME support, real-time." },
                      { strong: "Recipe-level food cost", rest: "auto-updates with every inventory price change." },
                      { strong: "Manager · server · chef", rest: "— each gets their own login and only sees what they should." },
                    ].map((s) => (
                      <View key={s.strong} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                        <View style={{ marginTop: 2, width: 18, height: 18, borderRadius: 4, backgroundColor: "rgba(255,90,31,0.18)", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="checkmark" size={11} color="#FFB088" />
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 19 }}>
                          <Text style={{ fontWeight: "700", color: "#fff" }}>{s.strong}</Text>
                          <Text> {s.rest}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" }} />
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 0.4, fontFamily: T.fontMono }}>
                    100+ KITCHENS · BENGALURU · ₹3K–4K / MONTH
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Form */}
            <View style={{ flex: 1, padding: wide ? 48 : 24, justifyContent: "center", maxWidth: 560, alignSelf: "center", width: "100%" }}>
              {!wide ? (
                <View style={{ marginBottom: 18, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "#FF5A1F", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.6 }}>D</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", letterSpacing: -0.5, color: "#0E0E0C", fontFamily: T.fontDisp }}>
                    DIME for Restaurants
                  </Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.4, fontFamily: T.fontMono }}>
                START YOUR RESTAURANT'S WORKSPACE
              </Text>
              <Text style={{ marginTop: 6, fontSize: 28, fontWeight: "700", color: "#0E0E0C", letterSpacing: -0.8, fontFamily: T.fontDisp }}>
                Pour the kitchen{"\n"}a strong cup of clarity.
              </Text>
              <Text style={{ marginTop: 6, fontSize: 13, color: T.muted, lineHeight: 19 }}>
                Two minutes. One form. We'll spin up your restaurant's account, your live listing on DIME, and drop you straight onto the dashboard your team will run on tonight.
              </Text>

              <View style={{ marginTop: 22, gap: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.2, fontFamily: T.fontMono }}>
                  RESTAURANT
                </Text>
                <Input
                  label="Restaurant name"
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholder="e.g. The Golden Spice"
                />
                <Input
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Bangalore"
                />

                <Text style={{ marginTop: 6, fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.2, fontFamily: T.fontMono }}>
                  ABOUT YOU
                </Text>
                <Input
                  label="Your full name"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="e.g. Priya Sharma"
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="you@restaurant.com"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Phone"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="+91"
                    />
                  </View>
                </View>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="6+ characters"
                />

                <View style={{ marginTop: 6 }}>
                  <Button label={busy ? "Creating workspace…" : "Create restaurant workspace"} loading={busy} onPress={submit} fullWidth />
                </View>
                <Text style={{ marginTop: 6, fontSize: 11, color: T.muted, textAlign: "center", lineHeight: 16 }}>
                  By signing up you agree to DIME's restaurant-partner terms. Your listing goes live after our team verifies your details.
                </Text>
              </View>

              <View style={{ marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#ECECEC", gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 13, color: T.muted }}>Already a partner?</Text>
                  <Link href="/owner/login" style={{ fontSize: 13, color: "#FF5A1F", fontWeight: "700" }}>
                    Sign in
                  </Link>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 12, color: T.muted }}>Are you a server / waiter?</Text>
                  <Link href="/server/login" style={{ fontSize: 12, color: "#FF5A1F", fontWeight: "700" }}>
                    Server login →
                  </Link>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 12, color: T.muted }}>Looking to dine?</Text>
                  <Link href="/login" style={{ fontSize: 12, color: T.ink, fontWeight: "600" }}>
                    Diner sign in
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
