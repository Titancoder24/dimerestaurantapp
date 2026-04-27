import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/store/auth";

export default function AuthLayout() {
  const router = useRouter();
  const hydrated = useAuth((s) => s.hydrated);
  const session = useAuth((s) => s.session);

  useEffect(() => {
    if (hydrated && session) {
      requestAnimationFrame(() => router.replace("/"));
    }
  }, [hydrated, session, router]);

  if (hydrated && session) return null;

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
