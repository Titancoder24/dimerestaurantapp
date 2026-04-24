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
  { href: "/loyalty", label: "Loyalty" },
];

/**
 * On native and on phone-sized web, this is a pass-through.
 *
 * On web at >= 900 px the customer routes get a real desktop shell:
 *   - sticky top nav with brand wordmark, primary tabs, cart + bell + avatar
 *   - max-width 1200px content column centered on the page
 *   - the bottom tab bar from (tabs)/_layout is hidden via the same width check
 *
 * Owner / admin / server routes are skipped — they're full-window dashboards.
 */
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
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Sticky top nav */}
      <View className="flex-row items-center border-b border-dime-border bg-white/95 px-6 py-3" style={webStickyTop}>
        <Pressable onPress={() => { haptic.light(); router.push("/home"); }} className="flex-row items-center gap-2 mr-8">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-dime-orange-500">
            <Text className="text-[16px] font-bold text-white">D</Text>
          </View>
          <Text className="text-[18px] font-semibold tracking-tight text-dime-ink">DIME</Text>
        </Pressable>

        {session ? (
          <View className="flex-row items-center gap-1">
            {tabs.map((t) => {
              const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
              return (
                <Pressable
                  key={t.href}
                  onPress={() => { haptic.light(); router.push(t.href as never); }}
                  className={cn(
                    "rounded-lg px-3 py-2",
                    active ? "bg-dime-orange-50" : "bg-transparent"
                  )}
                >
                  <Text className={cn("text-[14px]", active ? "font-semibold text-dime-orange-700" : "text-dime-ink-2")}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View className="ml-auto flex-row items-center gap-3">
          {session ? (
            <>
              {cartCount > 0 ? (
                <Pressable
                  onPress={() => { haptic.light(); router.push("/cart"); }}
                  className="relative h-10 w-10 items-center justify-center rounded-full bg-dime-bg-2"
                >
                  <Icon name="cart.fill" size={16} color="#1C1C1E" />
                  <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-dime-orange-500 px-1">
                    <Text className="text-[10px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</Text>
                  </View>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => { haptic.light(); router.push("/notifications"); }}
                className="relative h-10 w-10 items-center justify-center rounded-full bg-dime-bg-2"
              >
                <Icon name="bell.fill" size={16} color="#1C1C1E" />
                {unread > 0 ? (
                  <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-dime-orange-500 px-1">
                    <Text className="text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable onPress={() => { haptic.light(); router.push("/profile"); }} className="flex-row items-center gap-2 rounded-full bg-dime-bg-2 py-1 pl-1 pr-3">
                <Avatar name={profile?.name} uri={profile?.avatar_url} size={32} />
                <Text className="text-[13px] font-medium text-dime-ink">{profile?.name?.split(" ")[0] ?? "Account"}</Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row items-center gap-2">
              <Link href="/login" className="text-[14px] font-medium text-dime-ink-2">Sign in</Link>
              <Pressable onPress={() => router.push("/signup")} className="rounded-full bg-dime-orange-500 px-4 py-2">
                <Text className="text-[13px] font-semibold text-white">Sign up</Text>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: "/signup", params: { role: "owner" } })} className="rounded-full border border-dime-border bg-white px-4 py-2">
                <Text className="text-[13px] font-semibold text-dime-orange-600">Partner with DIME</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Centered content column */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 1200 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

const webStickyTop = Platform.OS === "web"
  ? ({ position: "sticky", top: 0, zIndex: 40 } as object)
  : undefined;
