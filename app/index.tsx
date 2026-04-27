import { useEffect } from "react";
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
    } else {
      requestAnimationFrame(() => router.replace("/home"));
    }
  }, [hydrated, session, profile, router]);

  return null;
}
