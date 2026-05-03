// Owner inbox — chat threads with customers + active support thread.
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useChatThreads, useEnsureSupportThread } from "@/hooks/chat";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, EmptyState, StatRow, StatTile,
  OWNER_INK, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";
import { ThreadListRow } from "@/components/chat/ChatThreadView";
import { Icon } from "@/components/ui";

export default function OwnerMessages() {
  const router = useRouter();
  const toast = useToast();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: threads } = useChatThreads({ forRestaurantId: restaurant?.id });
  const ensureSupport = useEnsureSupportThread();

  const customerThreads = (threads ?? []).filter((t) => t.kind === "customer_owner");
  const supportThread = (threads ?? []).find((t) => t.kind === "owner_support" && t.status === "open");

  const totalUnread = customerThreads.reduce((s, t) => s + t.owner_unread, 0);
  const openCount = customerThreads.filter((t) => t.status === "open").length;
  const slaWindow = customerThreads.filter((t) => t.last_message_at && Date.now() - new Date(t.last_message_at).getTime() < 3600_000).length;

  const openSupport = async () => {
    if (!restaurant?.id) return;
    try {
      const t = await ensureSupport.mutateAsync({ restaurantId: restaurant.id });
      router.push({ pathname: "/chat/[id]", params: { id: t.id } });
    } catch (e) {
      toast.error("Could not start support chat", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader
        title="Messages"
        subtitle="Real-time chat with diners + DIME support."
        rightAction={supportThread ? "DIME support" : "Chat with support"}
        actionIcon="text.bubble.fill"
        onAction={() =>
          supportThread
            ? router.push({ pathname: "/chat/[id]", params: { id: supportThread.id } })
            : openSupport()
        }
      />

      <StatRow>
        <StatTile icon="bell.fill" iconColor="#D43A2F" iconBg="#FCEAE6" label="Unread" value={String(totalUnread)} hint="Across all customer threads" />
        <StatTile icon="text.bubble.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Open threads" value={String(openCount)} hint="Active conversations" />
        <StatTile icon="clock.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Last hour" value={String(slaWindow)} hint="Recent activity" />
        <StatTile
          icon="checkmark.circle.fill"
          iconColor={supportThread ? "#3358D4" : "#A1A09A"}
          iconBg={supportThread ? "#E6EDFA" : "#F5F5F4"}
          label="DIME support"
          value={supportThread ? "Active" : "—"}
          hint={supportThread ? "Conversation open" : "Start a thread"}
        />
      </StatRow>

      <CardShell>
        <CardHeader
          title="Customer conversations"
          subtitle={`${customerThreads.length} ${customerThreads.length === 1 ? "thread" : "threads"}`}
          right={
            totalUnread > 0 ? (
              <View
                style={{
                  paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                  backgroundColor: OWNER_ACCENT,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#fff", fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                  {totalUnread} NEW
                </Text>
              </View>
            ) : null
          }
        />
        {customerThreads.length === 0 ? (
          <EmptyState
            icon="text.bubble.fill"
            title="No conversations yet"
            body="When a diner taps Chat on your restaurant page, the thread appears here. Replies go out in real time over Supabase Realtime."
          />
        ) : (
          customerThreads.map((t) => (
            <ThreadListRow
              key={t.id}
              thread={t}
              unreadKey="owner_unread"
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: t.id } })}
            />
          ))
        )}
      </CardShell>

      {/* Support thread tile */}
      <CardShell>
        <CardHeader title="DIME support" subtitle="Direct line to our team" />
        <Pressable
          onPress={() =>
            supportThread
              ? router.push({ pathname: "/chat/[id]", params: { id: supportThread.id } })
              : openSupport()
          }
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            paddingHorizontal: 18, paddingVertical: 14,
            borderTopWidth: 1, borderTopColor: OWNER_HAIRLINE,
          }}
        >
          <View
            style={{
              width: 42, height: 42, borderRadius: 999,
              backgroundColor: "#0E0E0C",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="sparkles" size={18} color="#FFB088" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.2 }}>
              DIME Support Team
            </Text>
            <Text style={{ marginTop: 1, fontSize: 12, color: "#8B8780" }}>
              {supportThread?.last_message ?? "Tap to start a new conversation. Avg response under 30 minutes during business hours."}
            </Text>
          </View>
          <Icon name="chevron.right" size={14} color="#A1A09A" />
        </Pressable>
      </CardShell>
    </PageScroll>
  );
}
