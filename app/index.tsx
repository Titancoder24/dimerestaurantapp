import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/store/auth";

export default function Index() {
  const router = useRouter();
  const hydrated = useAuth((s) => s.hydrated);
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      requestAnimationFrame(() => router.replace("/login"));
      return;
    }
    if (!profile) return;

    if (profile.role === "super_admin") {
      requestAnimationFrame(() => router.replace("/admin/dashboard"));
    } else if (profile.role === "owner" || profile.role === "manager") {
      requestAnimationFrame(() => router.replace("/owner/dashboard"));
    } else if (profile.role === "server" || profile.role === "host" || profile.role === "chef" || profile.role === "cashier") {
      requestAnimationFrame(() => router.replace("/server/tables"));
    } else {
      requestAnimationFrame(() => router.replace("/home"));
    }
  }, [hydrated, session, profile, router]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FC8019", alignItems: "center", justifyContent: "center" }}>
      <View style={{ height: 72, width: 72, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 38, fontWeight: "800", color: "#1C1C1E", letterSpacing: -1.5 }}>D</Text>
      </View>
    </View>
  );
}
