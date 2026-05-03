import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { useChatMessages, useChatThread, useSendMessage, useMarkThreadRead, type ChatMessage } from "@/hooks/chat";
import { timeAgo } from "@/lib/format";
import { T } from "@/lib/visual";

type Props = {
  threadId: string;
  myUserId: string;
  myRole: ChatMessage["sender_role"];
  /** What appears in the header — restaurant name, customer name, or "DIME Support" */
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Which counter to clear when this view mounts: 'customer' | 'owner' | 'admin' */
  markReadAs?: "customer" | "owner" | "admin";
};

export function ChatThreadView({ threadId, myUserId, myRole, title, subtitle, onBack, markReadAs }: Props) {
  const { data: thread } = useChatThread(threadId);
  const { data: messages, isLoading } = useChatMessages(threadId);
  const send = useSendMessage();
  const markRead = useMarkThreadRead();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (markReadAs) markRead.mutate({ threadId, role: markReadAs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, markReadAs]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages?.length]);

  const submit = () => {
    if (!draft.trim()) return;
    send.mutate(
      { threadId, senderId: myUserId, senderRole: myRole, body: draft.trim() },
      { onSuccess: () => setDraft("") }
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: T.bg }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 12,
          paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
          backgroundColor: "#fff",
          borderBottomWidth: 1, borderBottomColor: T.hairline,
        }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: T.cream, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="chevron.left" size={18} color={T.ink} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.3 }}>
            {title}
          </Text>
          {subtitle ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: thread?.status === "open" ? "#0F8A4F" : "#A1A09A" }} />
              <Text style={{ fontSize: 11, color: T.muted, fontWeight: "500" }}>{subtitle}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => <Bubble msg={item} mine={item.sender_id === myUserId} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.cream, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon name="text.bubble.fill" size={20} color={T.saffron} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: T.ink }}>Start the conversation</Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: T.muted, textAlign: "center", maxWidth: 260 }}>
                Messages are encrypted in transit and delivered in real time.
              </Text>
            </View>
          )
        }
      />

      {/* Composer */}
      <View
        style={{
          flexDirection: "row", alignItems: "flex-end", gap: 8,
          paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 26 : 14,
          backgroundColor: "#fff",
          borderTopWidth: 1, borderTopColor: T.hairline,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: T.cream,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === "ios" ? 10 : 6,
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor={T.muted}
            multiline
            style={{ fontSize: 14, color: T.ink, maxHeight: 120 }}
          />
        </View>
        <Pressable
          onPress={submit}
          disabled={!draft.trim() || send.isPending}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: draft.trim() ? T.saffron : T.creamDeep,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="paperplane.fill" size={16} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const bg = mine ? T.ink : "#fff";
  const fg = mine ? T.cream : T.ink;
  const meta = mine ? "rgba(255,255,255,0.55)" : T.muted;
  return (
    <View style={{ flexDirection: "row", justifyContent: mine ? "flex-end" : "flex-start" }}>
      <View
        style={{
          maxWidth: "78%",
          backgroundColor: bg,
          borderRadius: 16,
          borderBottomRightRadius: mine ? 4 : 16,
          borderBottomLeftRadius: mine ? 16 : 4,
          paddingHorizontal: 14, paddingVertical: 10,
          borderWidth: mine ? 0 : 1, borderColor: T.hairline,
        }}
      >
        {!mine ? (
          <Text style={{ fontSize: 10.5, fontWeight: "700", color: T.saffron, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
            {msg.sender_role.replace("_", " ")}
          </Text>
        ) : null}
        <Text style={{ fontSize: 14, color: fg, lineHeight: 19 }}>{msg.body}</Text>
        <Text style={{ marginTop: 4, fontSize: 10, color: meta, textAlign: "right" }}>
          {timeAgo(msg.created_at)}
        </Text>
      </View>
    </View>
  );
}

export function ThreadListRow({
  thread,
  onPress,
  unreadKey,
  rightLabel,
}: {
  thread: import("@/hooks/chat").ChatThread;
  onPress: () => void;
  unreadKey: "customer_unread" | "owner_unread" | "admin_unread";
  rightLabel?: string;
}) {
  const unread = thread[unreadKey] as number;
  const display =
    thread.kind === "customer_owner"
      ? thread.customer?.name ?? thread.customer?.email ?? "Guest"
      : thread.subject ?? "Support thread";
  const avatarUri = thread.kind === "customer_owner" ? thread.customer?.avatar_url ?? null : thread.restaurant?.cover_image_url ?? null;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: unread > 0 ? T.cream : "#fff",
        borderTopWidth: 1, borderTopColor: T.hairline,
      }}
    >
      <Avatar uri={avatarUri} name={display} size={42} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: unread > 0 ? "700" : "600", color: T.ink }}>
            {display}
          </Text>
          {thread.last_message_at ? (
            <Text style={{ fontSize: 10.5, color: T.muted, fontFamily: T.fontMono }}>
              {timeAgo(thread.last_message_at)}
            </Text>
          ) : null}
        </View>
        <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: unread > 0 ? T.ink2 : T.muted, fontWeight: unread > 0 ? "500" : "400" }}>
          {thread.last_message ?? rightLabel ?? "No messages yet"}
        </Text>
      </View>
      {unread > 0 ? (
        <View
          style={{
            minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10,
            backgroundColor: T.saffron,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff", fontFamily: T.fontMono }}>
            {unread > 9 ? "9+" : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
