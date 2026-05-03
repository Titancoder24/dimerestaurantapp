// Staff invite redemption page — staff sets a password, signs up, gets linked.
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Icon, Input, Screen } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { T } from "@/lib/visual";

type InviteRow = {
  id: string;
  code: string;
  restaurant_id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  expires_at: string;
  consumed_at: string | null;
  restaurant?: { name: string; cover_image_url: string | null } | null;
};

const ROLE_LABEL: Record<string, string> = {
  manager: "Manager",
  server: "Server",
  host: "Host",
  chef: "Chef",
  cashier: "Cashier",
};

export default function InviteRedeem() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const toast = useToast();
  const profile = useAuth((s) => s.profile);
  const session = useAuth((s) => s.session);

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: invite, isLoading, error } = useQuery({
    queryKey: ["invite", code],
    enabled: !!code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invites")
        .select("*, restaurant:restaurants(name, cover_image_url)")
        .eq("code", code!)
        .maybeSingle();
      if (error) throw error;
      return data as InviteRow | null;
    },
  });

  useEffect(() => {
    // If the user is already signed in AND it matches the invite email, auto-redeem
    const tryAutoRedeem = async () => {
      if (!session || !invite || invite.consumed_at) return;
      if (profile?.email?.toLowerCase() !== invite.email.toLowerCase()) return;
      setBusy(true);
      try {
        const { error: rpcErr } = await supabase.rpc("redeem_staff_invite", { p_code: invite.code });
        if (rpcErr) throw rpcErr;
        toast.success("Joined!", `Welcome to ${invite.restaurant?.name}`);
        // route by role
        if (invite.role === "server") router.replace("/server/tables");
        else router.replace("/owner/dashboard");
      } catch (e) {
        toast.error("Could not redeem", (e as Error).message);
      } finally {
        setBusy(false);
      }
    };
    tryAutoRedeem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, invite?.id]);

  const acceptAndSignUp = async () => {
    if (!invite) return;
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      // 1. Sign up the auth user
      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: { data: { name: invite.name, phone: invite.phone } },
      });
      if (signUpErr && !signUpErr.message?.toLowerCase().includes("already registered")) throw signUpErr;

      // 2. If sign-up created a fresh session, redeem now
      if (signUp.session) {
        const { error: rpcErr } = await supabase.rpc("redeem_staff_invite", { p_code: invite.code });
        if (rpcErr) throw rpcErr;
        toast.success("Joined!", `Welcome to ${invite.restaurant?.name}`);
        if (invite.role === "server") router.replace("/server/tables");
        else router.replace("/owner/dashboard");
        return;
      }

      // 3. If user already exists, try sign-in to redeem
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      });
      if (signInErr) throw new Error("Account exists. Sign in with the existing password and reopen this link.");
      const { error: rpcErr2 } = await supabase.rpc("redeem_staff_invite", { p_code: invite.code });
      if (rpcErr2) throw rpcErr2;
      toast.success("Joined!", `Welcome to ${invite.restaurant?.name}`);
      if (invite.role === "server") router.replace("/server/tables");
      else router.replace("/owner/dashboard");
    } catch (e) {
      toast.error("Could not accept invite", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 13, color: T.muted }}>Loading invite…</Text>
        </View>
      </Screen>
    );
  }

  if (error || !invite) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: "#FCEAE6", alignItems: "center", justifyContent: "center" }}>
            <Icon name="xmark" size={28} color={T.ruby} />
          </View>
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "700", color: T.ink }}>Invite not found</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: T.muted, textAlign: "center", maxWidth: 320 }}>
            This invite link is invalid or has been revoked. Ask the restaurant owner for a new one.
          </Text>
          <View style={{ marginTop: 18 }}>
            <Button label="Go home" variant="secondary" onPress={() => router.replace("/home")} />
          </View>
        </View>
      </Screen>
    );
  }

  if (invite.consumed_at) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: "#E6F4ED", alignItems: "center", justifyContent: "center" }}>
            <Icon name="checkmark.circle.fill" size={28} color={T.forest} />
          </View>
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "700", color: T.ink }}>Already redeemed</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: T.muted, textAlign: "center", maxWidth: 320 }}>
            This invite has been used. Sign in with the email it was sent to.
          </Text>
          <View style={{ marginTop: 18 }}>
            <Button label="Sign in" onPress={() => router.replace("/login")} />
          </View>
        </View>
      </Screen>
    );
  }

  const expired = new Date(invite.expires_at).getTime() < Date.now();
  if (expired) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: "#FFF7E0", alignItems: "center", justifyContent: "center" }}>
            <Icon name="hourglass" size={28} color="#D97706" />
          </View>
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "700", color: T.ink }}>Invite expired</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: T.muted, textAlign: "center", maxWidth: 320 }}>
            Ask {invite.restaurant?.name ?? "the restaurant"} to send you a fresh invite.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: "center" }}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 56, height: 56, borderRadius: 14,
              backgroundColor: "#FF5A1F",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -1 }}>D</Text>
          </View>
          <Text style={{ marginTop: 16, fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.4, fontFamily: T.fontMono }}>
            STAFF INVITE
          </Text>
          <Text style={{ marginTop: 6, fontSize: 26, fontWeight: "700", color: T.ink, letterSpacing: -0.6, fontFamily: T.fontDisp, textAlign: "center" }}>
            Join {invite.restaurant?.name ?? "this restaurant"}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: T.ink2, textAlign: "center", maxWidth: 320, lineHeight: 19 }}>
            You've been invited as a <Text style={{ fontWeight: "700", color: T.ink }}>{ROLE_LABEL[invite.role] ?? invite.role}</Text>. Set a password to claim your account.
          </Text>
        </View>

        <View
          style={{
            marginTop: 28, alignSelf: "stretch", maxWidth: 420, width: "100%",
            backgroundColor: "#fff", borderRadius: 18, padding: 20,
            borderWidth: 1, borderColor: T.hairline,
          }}
        >
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.2, fontFamily: T.fontMono }}>
                NAME
              </Text>
              <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "600", color: T.ink }}>{invite.name}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.2, fontFamily: T.fontMono }}>
                EMAIL
              </Text>
              <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "600", color: T.ink }}>{invite.email}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: T.muted, letterSpacing: 1.2, fontFamily: T.fontMono }}>
                ROLE
              </Text>
              <View style={{ marginTop: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: T.cream }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: T.saffron, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {ROLE_LABEL[invite.role] ?? invite.role}
                </Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: T.hairline, marginVertical: 6 }} />
            <Input
              label="Set a password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <Button
              label={busy ? "Joining…" : "Accept invite & sign up"}
              loading={busy}
              onPress={acceptAndSignUp}
              fullWidth
            />
            <Pressable onPress={() => router.replace("/login")} style={{ alignSelf: "center", paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: T.muted }}>
                Already have an account? <Text style={{ color: T.saffron, fontWeight: "700" }}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}
