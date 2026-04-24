import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";

export default function Index() {
  const session = useAuth((s) => s.session);
  const profile = useAuth((s) => s.profile);

  if (!session) return <Redirect href="/login" />;

  // Role-based landing
  if (profile?.role === "super_admin") return <Redirect href="/admin/dashboard" />;
  if (profile?.role === "owner" || profile?.role === "manager") {
    return <Redirect href="/owner/dashboard" />;
  }
  return <Redirect href="/home" />;
}
