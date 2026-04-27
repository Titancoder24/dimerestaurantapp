import { useEffect, useState } from "react";
import { FlatList, Text, TextInput, View, Pressable } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Button, Chip, ChipRow, Header, Icon, Input, Screen, Sheet, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useOwnedRestaurant } from "@/hooks/owner";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";

const categories: { k: "app_bug" | "restaurant_complaint" | "feedback" | "account_issue" | "payment_issue" | "other"; l: string; icon: string }[] = [
  { k: "app_bug", l: "Bug report", icon: "exclamationmark.triangle.fill" },
  { k: "restaurant_complaint", l: "Customer complaint", icon: "flag.fill" },
  { k: "feedback", l: "Feedback / feature", icon: "sparkles" },
  { k: "payment_issue", l: "Billing issue", icon: "creditcard.fill" },
  { k: "account_issue", l: "Account issue", icon: "lock.fill" },
  { k: "other", l: "Something else", icon: "ellipsis" },
];

const priorities: ("low" | "medium" | "high" | "critical")[] = ["low", "medium", "high", "critical"];

type TicketWithMessages = Tables<"support_tickets"> & {
  support_messages: Tables<"support_messages">[];
};

export default function OwnerHelp() {
  const profile = useAuth((s) => s.profile);
  const { data: restaurant } = useOwnedRestaurant();
  const toast = useToast();
  const qc = useQueryClient();

  const [composing, setComposing] = useState(false);
  const [openTicket, setOpenTicket] = useState<TicketWithMessages | null>(null);

  const { data: tickets } = useQuery({
    queryKey: ["owner-tickets", restaurant?.id, profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, support_messages(*)")
        .or(`user_id.eq.${profile!.id},restaurant_id.eq.${restaurant?.id ?? "00000000-0000-0000-0000-000000000000"}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TicketWithMessages[];
    },
  });

  const counts = {
    open: (tickets ?? []).filter((t) => t.status === "open" || t.status === "in_progress").length,
    resolved: (tickets ?? []).filter((t) => t.status === "resolved" || t.status === "closed").length,
  };

  return (
    <Screen scroll={false}>
      <Header
        title="Help & Support"
        subtitle={restaurant?.name ?? ""}
        right={
          <Pressable onPress={() => setComposing(true)} className="rounded-full bg-dime-primary-500 px-3 py-1.5">
            <Text className="text-[12px] font-bold text-white">+ New</Text>
          </Pressable>
        }
      />

      <View className="flex-row gap-2 px-5">
        <Tile color="bg-dime-danger" label="Open" value={counts.open} />
        <Tile color="bg-emerald-500" label="Resolved" value={counts.resolved} />
      </View>

      <FlatList
        data={tickets ?? []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="tray.fill" size={32} color="#BFBFBF" />
            <Text className="mt-3 text-[15px] font-bold text-dime-ink">No tickets yet</Text>
            <Text className="mt-1 max-w-[280px] text-center text-[13px] text-dime-ink-3">
              Spotted a bug, want to flag a customer complaint, or just have feedback? Tap "New" to file a ticket — our team replies within a working day.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setOpenTicket(item)}
            className="rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{item.ticket_number}</Text>
              <View className="ml-auto flex-row gap-1.5">
                <Badge tone={item.priority === "critical" ? "red" : item.priority === "high" ? "orange" : "gray"} label={item.priority} />
                <Badge tone={item.status === "resolved" || item.status === "closed" ? "green" : item.status === "in_progress" ? "orange" : "red"} label={item.status.replace("_", " ")} />
              </View>
            </View>
            <Text className="mt-1 text-[14px] font-bold text-dime-ink">{item.subject}</Text>
            <Text className="text-[11px] text-dime-ink-3">{categoryLabel(item.category)} · {timeAgo(item.created_at)}</Text>
            {item.support_messages.length > 0 ? (
              <Text numberOfLines={2} className="mt-2 text-[12px] text-dime-ink-2">
                {item.support_messages[item.support_messages.length - 1]?.message}
              </Text>
            ) : null}
          </Pressable>
        )}
      />

      <ComposeSheet
        visible={composing}
        onClose={() => setComposing(false)}
        userId={profile?.id}
        restaurantId={restaurant?.id}
        onSubmitted={() => {
          setComposing(false);
          qc.invalidateQueries({ queryKey: ["owner-tickets"] });
        }}
      />

      <ThreadSheet
        ticket={openTicket}
        onClose={() => setOpenTicket(null)}
        userId={profile?.id}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["owner-tickets"] })}
      />
    </Screen>
  );
}

function categoryLabel(k: string): string {
  return categories.find((c) => c.k === k)?.l ?? k;
}

function Tile({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} py-3`}>
      <Text className="text-[24px] font-bold text-white">{value}</Text>
      <Text className="text-[11px] font-bold uppercase text-white/90" style={{ letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}

function ComposeSheet({
  visible, onClose, userId, restaurantId, onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  restaurantId?: string;
  onSubmitted: () => void;
}) {
  const toast = useToast();
  const [category, setCategory] = useState<typeof categories[number]["k"]>("app_bug");
  const [priority, setPriority] = useState<typeof priorities[number]>("medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCategory("app_bug"); setPriority("medium"); setSubject(""); setMessage("");
  }, [visible]);

  async function submit() {
    if (!userId) return toast.error("Not signed in");
    if (subject.length < 4) return toast.error("Add a subject");
    if (message.length < 10) return toast.error("Add some detail");
    setSaving(true);
    try {
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: userId,
          restaurant_id: restaurantId ?? null,
          category,
          priority,
          subject,
          status: "open",
        })
        .select().single();
      if (error) throw error;
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_type: "user",
        sender_id: userId,
        message,
      });
      haptic.success();
      toast.success("Ticket created", `We'll get back to you on ${ticket.ticket_number}`);
      onSubmitted();
    } catch (e) {
      haptic.error();
      toast.error("Could not submit", (e as Error).message);
    } finally { setSaving(false); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>New ticket</Text>

        <View className="mt-4">
          <Text className="mb-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Pressable
                key={c.k}
                onPress={() => { haptic.select(); setCategory(c.k); }}
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${category === c.k ? "border-2 border-dime-primary-500 bg-dime-primary-50" : "bg-white"}`}
                style={category !== c.k ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 } : undefined}
              >
                <Icon name={c.icon} size={12} color={category === c.k ? "#FF6B2C" : "#8A8A8A"} />
                <Text className={`text-[12px] font-bold ${category === c.k ? "text-dime-primary-700" : "text-dime-ink-2"}`}>{c.l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4">
          <Text className="mb-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Priority</Text>
          <ChipRow>
            {priorities.map((p) => (
              <Chip key={p} label={p} selected={priority === p} onPress={() => setPriority(p)} />
            ))}
          </ChipRow>
        </View>

        <View className="mt-4 gap-4">
          <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Short summary" />
          <View>
            <Text className="mb-1.5 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>What happened?</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              placeholder="Steps to reproduce, screenshots, customer details, etc."
              placeholderTextColor="#8A8A8A"
              className="min-h-[140px] rounded-xl border border-neutral-50 bg-white p-3 text-[14px] text-dime-ink"
              textAlignVertical="top"
            />
          </View>
        </View>

        <View className="mt-5">
          <Button label="Submit ticket" loading={saving} onPress={submit} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

function ThreadSheet({
  ticket, onClose, userId, onUpdated,
}: {
  ticket: TicketWithMessages | null;
  onClose: () => void;
  userId?: string;
  onUpdated: () => void;
}) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!ticket || !userId || reply.trim().length < 2) return;
    setSending(true);
    try {
      await supabase.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_type: "user",
        sender_id: userId,
        message: reply.trim(),
      });
      setReply("");
      haptic.success();
      onUpdated();
    } finally { setSending(false); }
  }

  if (!ticket) return null;

  return (
    <Sheet visible={!!ticket} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        <View className="flex-row items-center gap-2">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{ticket.ticket_number}</Text>
          <Badge tone={ticket.status === "resolved" || ticket.status === "closed" ? "green" : ticket.status === "in_progress" ? "orange" : "red"} label={ticket.status.replace("_", " ")} />
        </View>
        <Text className="mt-1 text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{ticket.subject}</Text>

        <View className="mt-4 max-h-[400px] gap-2">
          {ticket.support_messages.map((m) => {
            const mine = m.sender_type === "user";
            return (
              <View key={m.id} className={mine ? "items-end" : "items-start"}>
                <View className={`max-w-[80%] rounded-2xl p-3 ${mine ? "bg-dime-primary-500" : "bg-dime-bg-2"}`}>
                  <Text className={`text-[13px] ${mine ? "text-white" : "text-dime-ink"}`}>{m.message}</Text>
                </View>
                <Text className="mt-1 text-[10px] text-dime-ink-3">{mine ? "You" : "Support"} · {timeAgo(m.created_at)}</Text>
              </View>
            );
          })}
        </View>

        {ticket.status !== "closed" ? (
          <View className="mt-4 flex-row items-end gap-2">
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Add a reply..."
              placeholderTextColor="#8A8A8A"
              multiline
              className="min-h-[44px] flex-1 rounded-xl border border-neutral-50 bg-white p-3 text-[14px] text-dime-ink"
            />
            <Button label="Send" loading={sending} onPress={send} />
          </View>
        ) : (
          <Text className="mt-4 text-center text-[12px] text-dime-ink-3">This ticket is closed.</Text>
        )}
      </Sheet.Body>
    </Sheet>
  );
}
