// Super-admin inbox of restaurant-owner support threads.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "@/components/ui";
import { useChatThreads } from "@/hooks/chat";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  StatRow, StatTile,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE,
  ADMIN_HOVER, ADMIN_ACCENT, ADMIN_GREEN,
} from "@/components/admin/shell";

export default function AdminSupportChats() {
  const router = useRouter();
  const { data: threads, isLoading } = useChatThreads({ asAdmin: true });
  const list = threads ?? [];
  const totalUnread = list.reduce((s, t) => s + t.admin_unread, 0);
  const ownerThreads = list.filter((t) => t.kind === "owner_support").length;
  const customerThreads = list.filter((t) => t.kind === "customer_owner").length;

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · PLATFORM · INBOX"
        title="Restaurant support inbox"
        subtitle="Real-time threads from operators using /owner/messages — replies sync via Supabase realtime."
        rightSlot={totalUnread > 0 ? <Pill tone="saffron" icon="bolt.fill">{totalUnread} unread</Pill> : <Pill tone="green" icon="checkmark.circle.fill">Inbox zero</Pill>}
      />

      <StatRow>
        <StatTile icon="text.bubble.fill" iconBg="#1F1F1F" iconColor={ADMIN_INK} label="Threads" value={String(list.length)} hint="All conversations" />
        <StatTile icon="building.2.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Operator threads" value={String(ownerThreads)} hint="Restaurant-to-admin" />
        <StatTile icon="person.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Customer threads" value={String(customerThreads)} hint="Diner-to-restaurant" />
        <StatTile icon="bell.fill" iconBg="#3A1212" iconColor="#F87171" label="Unread" value={String(totalUnread)} hint="Awaiting your reply" />
      </StatRow>

      <CardShell>
        <CardHeader title="Active threads" subtitle={`${list.length} conversations · click any row to open`} />
        {list.length === 0 && !isLoading ? (
          <EmptyState
            icon="text.bubble.fill"
            iconColor={ADMIN_GREEN}
            iconBg="#0E2F1F"
            title="No active support threads"
            body="When a restaurant owner messages support from /owner/messages, threads land here. Replies are real-time."
            compact
          />
        ) : null}
        {list.map((t, i) => {
          const isOwnerThread = t.kind === "owner_support";
          const display = isOwnerThread
            ? (t.subject ?? t.restaurant?.name ?? "Support thread")
            : (t.customer?.name ?? t.customer?.email ?? "Guest");
          const avatarUri = isOwnerThread
            ? t.restaurant?.cover_image_url ?? null
            : t.customer?.avatar_url ?? null;
          const unread = t.admin_unread;
          return (
            <Pressable
              key={t.id}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: t.id } })}
              style={({ hovered }: any) => ({
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 18, paddingVertical: 14,
                borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
                backgroundColor: hovered ? ADMIN_HOVER : "transparent",
              })}
            >
              <Avatar uri={avatarUri} name={display} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: unread > 0 ? "700" : "600", color: ADMIN_INK, letterSpacing: -0.2 }}>
                    {display}
                  </Text>
                  <Pill tone={isOwnerThread ? "saffron" : "lilac"}>{isOwnerThread ? "Operator" : "Customer"}</Pill>
                </View>
                <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 12, color: unread > 0 ? ADMIN_INK2 : ADMIN_INK3, fontWeight: unread > 0 ? "500" : "400" }}>
                  {t.last_message ?? "No messages yet"}
                </Text>
                {t.last_message_at ? (
                  <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(t.last_message_at).toUpperCase()}</MonoText>
                ) : null}
              </View>
              {unread > 0 ? (
                <View
                  style={{
                    minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11,
                    backgroundColor: ADMIN_ACCENT,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <MonoText size={11} weight="700" color="#1A0A04">
                    {unread > 9 ? "9+" : String(unread)}
                  </MonoText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </CardShell>
    </PageScroll>
  );
}
