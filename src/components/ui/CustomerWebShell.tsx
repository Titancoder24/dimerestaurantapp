import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Link, usePathname, useRouter } from "expo-router";
import { useAuth } from "@/store/auth";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { useUnreadNotificationCount } from "@/hooks/useNotificationListener";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/cn";
import { haptic } from "./haptics";

const NON_CUSTOMER_PREFIXES = ["/owner", "/admin", "/server"];

const tabs = [
  { href: "/home", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/bookings", label: "Bookings" },
  { href: "/profile", label: "Profile" },
];

export function CustomerWebShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const session = useAuth((s) => s.session);
  const cartCount = useCart((s) => s.count());
  const unread = useUnreadNotificationCount();

  const isWebDesktop = Platform.OS === "web" && width >= 900;
  const isCustomerRoute = !NON_CUSTOMER_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isWebDesktop || !isCustomerRoute) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F2EC" }}>
      {/* Nav bar */}
      <View
        className="flex-row items-center bg-white px-8 py-2.5"
        style={[webStickyTop, { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }]}
      >
        {/* Brand */}
        <Pressable
          onPress={() => { haptic.light(); router.push("/home"); }}
          className="mr-10 flex-row items-center gap-2.5"
        >
          <View className="h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: "#FF5A1F" }}>
            <Text className="text-[16px] font-bold text-white" style={{ letterSpacing: -0.5 }}>D</Text>
          </View>
          <Text className="text-[20px] font-bold text-[#0E0E0C]" style={{ letterSpacing: -0.5, fontFamily: '"Fraunces", Georgia, serif' }}>
            DIME
          </Text>
        </Pressable>

        {/* Nav tabs */}
        {session ? (
          <View className="flex-row items-center gap-0.5">
            {tabs.map((t) => {
              const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
              return (
                <Pressable
                  key={t.href}
                  onPress={() => { haptic.light(); router.push(t.href as never); }}
                  className="rounded-full px-4 py-2"
                  style={active ? { backgroundColor: "#FAF6EE" } : undefined}
                >
                  <Text
                    className={cn(
                      "text-[14px]",
                      active ? "font-bold text-[#0E0E0C]" : "font-medium text-[#3F3D38]"
                    )}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Right actions */}
        <View className="ml-auto flex-row items-center gap-2">
          {session ? (
            <>
              {cartCount > 0 ? (
                <Pressable
                  onPress={() => { haptic.light(); router.push("/cart"); }}
                  className="relative h-9 w-9 items-center justify-center rounded-full bg-[#F8F8F8]"
                >
                  <Icon name="cart.fill" size={15} color="#1C1C1E" />
                  <View className="absolute -right-0.5 -top-0.5 h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#E23744] px-1">
                    <Text className="text-[8px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</Text>
                  </View>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => { haptic.light(); router.push("/notifications"); }}
                className="relative h-9 w-9 items-center justify-center rounded-full bg-[#F8F8F8]"
              >
                <Icon name="bell.fill" size={15} color="#1C1C1E" />
                {unread > 0 ? (
                  <View className="absolute -right-0.5 -top-0.5 h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#E23744] px-1">
                    <Text className="text-[8px] font-bold text-white">{unread > 9 ? "9+" : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => { haptic.light(); router.push("/profile"); }}
                className="ml-1 flex-row items-center gap-2 rounded-full bg-[#F8F8F8] py-1.5 pl-1.5 pr-3.5"
              >
                <Avatar name={profile?.name} uri={profile?.avatar_url} size={28} />
                <Text className="text-[13px] font-semibold text-[#1C1C1E]">
                  {profile?.name?.split(" ")[0] ?? "Account"}
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row items-center gap-2.5">
              <Link href="/login" className="text-[14px] font-semibold text-[#535665]">
                Sign in
              </Link>
              <Pressable
                onPress={() => router.push("/signup")}
                className="rounded-full px-5 py-2"
                style={{ backgroundColor: "#E23744" }}
              >
                <Text className="text-[13px] font-bold text-white">Sign up</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: "/signup", params: { role: "owner" } })}
                className="rounded-full px-5 py-2"
                style={{ borderWidth: 1, borderColor: "#E8E8E8" }}
              >
                <Text className="text-[13px] font-bold text-[#1C1C1E]">Partner with DIME</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 1200 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

const webStickyTop = Platform.OS === "web"
  ? ({ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } as object)
  : undefined;
