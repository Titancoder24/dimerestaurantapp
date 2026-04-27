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
  { href: "/offers", label: "Offers" },
  { href: "/loyalty", label: "Rewards" },
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
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      {/* Premium sticky nav */}
      <View
        className="flex-row items-center bg-white px-8 py-3"
        style={[webStickyTop, { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" }]}
      >
        {/* Brand */}
        <Pressable
          onPress={() => { haptic.light(); router.push("/home"); }}
          className="mr-10 flex-row items-center gap-2.5"
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-ink">
            <Text className="text-[18px] font-bold text-white" style={{ letterSpacing: -0.5 }}>D</Text>
          </View>
          <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
            DIME
          </Text>
        </Pressable>

        {/* Nav tabs */}
        {session ? (
          <View className="flex-row items-center gap-1">
            {tabs.map((t) => {
              const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
              return (
                <Pressable
                  key={t.href}
                  onPress={() => { haptic.light(); router.push(t.href as never); }}
                  className={cn("rounded-full px-4 py-2")}
                >
                  <Text
                    className={cn(
                      "text-[14px]",
                      active ? "font-bold text-dime-ink" : "font-medium text-dime-ink-3"
                    )}
                  >
                    {t.label}
                  </Text>
                  {active ? (
                    <View className="mx-auto mt-1 h-[2px] w-4 rounded-full bg-dime-primary-500" />
                  ) : null}
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
                  className="relative h-10 w-10 items-center justify-center rounded-full bg-dime-bg-2"
                >
                  <Icon name="cart.fill" size={16} color="#0F0F0F" />
                  <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-dime-primary-500 px-1">
                    <Text className="text-[9px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</Text>
                  </View>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => { haptic.light(); router.push("/notifications"); }}
                className="relative h-10 w-10 items-center justify-center rounded-full bg-dime-bg-2"
              >
                <Icon name="bell.fill" size={16} color="#0F0F0F" />
                {unread > 0 ? (
                  <View className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-dime-primary-500 px-1">
                    <Text className="text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => { haptic.light(); router.push("/profile"); }}
                className="ml-1 flex-row items-center gap-2.5 rounded-full bg-dime-bg-2 py-1.5 pl-1.5 pr-4"
              >
                <Avatar name={profile?.name} uri={profile?.avatar_url} size={30} />
                <Text className="text-[13px] font-semibold text-dime-ink">
                  {profile?.name?.split(" ")[0] ?? "Account"}
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row items-center gap-3">
              <Link href="/login" className="text-[14px] font-semibold text-dime-ink-2">
                Sign in
              </Link>
              <Pressable
                onPress={() => router.push("/signup")}
                className="rounded-full bg-dime-ink px-5 py-2.5"
              >
                <Text className="text-[13px] font-bold text-white">Sign up</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: "/signup", params: { role: "owner" } })}
                className="rounded-full border border-neutral-200 bg-white px-5 py-2.5"
              >
                <Text className="text-[13px] font-bold text-dime-ink">Partner with DIME</Text>
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
