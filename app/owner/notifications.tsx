import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Chip, Header, Icon, Input, Screen, Sheet, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useTables } from "@/hooks/queries";
import { useToast } from "@/store/toast";
import { timeAgo, fullDate, time12, rupees } from "@/lib/format";
import dayjs from "dayjs";

type NotifRow = Tables<"notifications">;
type Filter = "all" | "bookings" | "orders" | "system";

const filterConfig: { key: Filter; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "tray.fill" },
  { key: "bookings", label: "Bookings", icon: "calendar" },
  { key: "orders", label: "Orders", icon: "bag.fill" },
  { key: "system", label: "System", icon: "bell.fill" },
];

function notifCategory(type: string): Filter {
  if (type.startsWith("booking")) return "bookings";
  if (type.startsWith("order")) return "orders";
  return "system";
}

function notifIcon(type: string): { name: string; bg: string; color: string } {
  switch (type) {
    case "booking_request": return { name: "calendar.badge.plus", bg: "bg-orange-50", color: "#FF6B2C" };
    case "booking_confirmed": return { name: "checkmark.circle.fill", bg: "bg-emerald-50", color: "#22C55E" };
    case "booking_rejected": return { name: "xmark.circle.fill", bg: "bg-red-50", color: "#EF4444" };
    case "order_update": return { name: "bag.fill", bg: "bg-blue-50", color: "#3B82F6" };
    case "restaurant_approved": return { name: "checkmark.seal.fill", bg: "bg-emerald-50", color: "#22C55E" };
    case "restaurant_rejected": return { name: "exclamationmark.triangle.fill", bg: "bg-red-50", color: "#EF4444" };
    default: return { name: "bell.fill", bg: "bg-gray-50", color: "#8A8A8A" };
  }
}

export default function OwnerNotifications() {
  const profile = useAuth((s) => s.profile);
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedNotif, setSelectedNotif] = useState<NotifRow | null>(null);
  const [responding, setResponding] = useState(false);
  const { data: restaurant } = useOwnedRestaurant();
  const { data: tables } = useTables(restaurant?.id);

  const { data: notifications } = useQuery({
    queryKey: ["owner-notifications", profile?.id],
    enabled: !!profile?.id,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as NotifRow[];
    },
  });

  useEffect(() => {
    if (!profile?.id) return;
    const ch = supabase
      .channel("owner-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["owner-notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id, qc]);

  const filtered = (notifications ?? []).filter((n) => filter === "all" || notifCategory(n.type) === filter);
  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["owner-notifications"] });
  }

  async function markAllRead() {
    if (!profile?.id) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["owner-notifications"] });
    haptic.success();
  }

  async function respondToBooking(bookingId: string, action: "confirmed" | "cancelled", note?: string) {
    if (!profile) return;
    setResponding(true);
    try {
      const update: Record<string, unknown> = {
        status: action,
        responded_by: profile.id,
      };
      if (note) update.response_note = note;

      const { error } = await supabase.from("bookings").update(update).eq("id", bookingId);
      if (error) throw error;

      haptic.success();
      toast.success(action === "confirmed" ? "Booking confirmed" : "Booking declined");
      if (selectedNotif) markRead(selectedNotif.id);
      setSelectedNotif(null);
      qc.invalidateQueries({ queryKey: ["restaurant-bookings"] });
    } catch (e) {
      toast.error("Failed", (e as Error).message);
    } finally { setResponding(false); }
  }

  function openNotif(n: NotifRow) {
    if (!n.is_read) markRead(n.id);
    setSelectedNotif(n);
  }

  const bookingData = selectedNotif?.data as Record<string, unknown> | null;
  const availableTables = (tables ?? []).filter((t) => t.status === "available" && t.seats >= ((bookingData?.guests as number) ?? 2));

  return (
    <Screen scroll={false}>
      <Header
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={markAllRead} className="rounded-full bg-dime-bg-2 px-3 py-1.5">
              <Text className="text-[12px] font-bold text-dime-ink-2">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      <View className="px-5">
        <FlatList
          horizontal
          data={filterConfig}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: f }) => {
            const count = f.key === "all"
              ? (notifications ?? []).filter((n) => !n.is_read).length
              : (notifications ?? []).filter((n) => !n.is_read && notifCategory(n.type) === f.key).length;
            return (
              <Chip
                label={`${f.label}${count > 0 ? ` (${count})` : ""}`}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 20, gap: 6, paddingBottom: 120 }}
        renderItem={({ item: n }) => {
          const ic = notifIcon(n.type);
          const isBookingRequest = n.type === "booking_request";
          return (
            <Pressable
              onPress={() => openNotif(n)}
              className={`flex-row items-start gap-3 rounded-2xl p-4 ${n.is_read ? "bg-white" : "bg-orange-50/60 border border-orange-100"}`}
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: n.is_read ? 0.03 : 0.06, shadowRadius: 8, elevation: 1 }}
            >
              <View className={`h-10 w-10 items-center justify-center rounded-full ${ic.bg}`}>
                <Icon name={ic.name} size={16} color={ic.color} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className={`flex-1 text-[13px] ${n.is_read ? "text-dime-ink" : "font-bold text-dime-ink"}`} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text className="text-[10px] text-dime-ink-4">{timeAgo(n.created_at)}</Text>
                </View>
                <Text className="mt-0.5 text-[12px] text-dime-ink-3" numberOfLines={2}>{n.message}</Text>
                {isBookingRequest && !n.is_read ? (
                  <View className="mt-2 flex-row gap-2">
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        const d = n.data as Record<string, unknown>;
                        respondToBooking(d.booking_id as string, "confirmed");
                        markRead(n.id);
                      }}
                      className="flex-row items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5"
                    >
                      <Icon name="checkmark" size={10} color="#fff" />
                      <Text className="text-[11px] font-bold text-white">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); openNotif(n); }}
                      className="flex-row items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5"
                    >
                      <Text className="text-[11px] font-bold text-dime-ink-2">View details</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
              {!n.is_read ? <View className="mt-1 h-2.5 w-2.5 rounded-full bg-dime-primary-500" /> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="bell.fill" size={32} color="#BFBFBF" />
            <Text className="mt-3 text-[15px] font-bold text-dime-ink">No notifications</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-3">When customers book or place orders, you'll see them here.</Text>
          </View>
        }
      />

      <Sheet visible={!!selectedNotif} onClose={() => setSelectedNotif(null)} maxHeight="85%">
        <Sheet.Body>
          {selectedNotif ? <NotifDetail
            notif={selectedNotif}
            availableTables={availableTables}
            responding={responding}
            onConfirm={(id) => respondToBooking(id, "confirmed")}
            onDecline={(id, note) => respondToBooking(id, "cancelled", note)}
          /> : null}
        </Sheet.Body>
      </Sheet>
    </Screen>
  );
}

function NotifDetail({ notif, availableTables, responding, onConfirm, onDecline }: {
  notif: NotifRow;
  availableTables: Tables<"tables">[];
  responding: boolean;
  onConfirm: (bookingId: string) => void;
  onDecline: (bookingId: string, note?: string) => void;
}) {
  const [declineNote, setDeclineNote] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const d = notif.data as Record<string, unknown>;
  const isBookingRequest = notif.type === "booking_request";

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${notifIcon(notif.type).bg}`}>
          <Icon name={notifIcon(notif.type).name} size={20} color={notifIcon(notif.type).color} />
        </View>
        <View className="flex-1">
          <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{notif.title}</Text>
          <Text className="text-[12px] text-dime-ink-3">{timeAgo(notif.created_at)}</Text>
        </View>
      </View>

      <Text className="text-[14px] leading-5 text-dime-ink-2">{notif.message}</Text>

      {isBookingRequest ? (
        <>
          <View className="gap-2 rounded-2xl bg-dime-bg-grouped p-4">
            <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Reservation details</Text>
            <InfoRow icon="person.fill" label="Guest" value={d.user_name as string ?? "Walk-in"} />
            <InfoRow icon="calendar" label="Date" value={d.date ? fullDate(d.date as string) : "—"} />
            <InfoRow icon="clock.fill" label="Time" value={d.time ? time12(d.time as string) : "—"} />
            <InfoRow icon="person.2.fill" label="Party size" value={`${d.guests ?? 2} guests`} />
            <InfoRow icon="chair.fill" label="Seating" value={(d.seating as string ?? "any")} />
            {d.occasion ? <InfoRow icon="gift.fill" label="Occasion" value={d.occasion as string} /> : null}
            {d.notes ? <InfoRow icon="text.bubble.fill" label="Notes" value={d.notes as string} /> : null}
          </View>

          {Array.isArray(d.pre_order) && (d.pre_order as { name: string; price: number; quantity: number }[]).length > 0 ? (
            <View className="rounded-2xl bg-amber-50 p-4">
              <Text className="mb-2 text-[11px] font-bold uppercase text-amber-700" style={{ letterSpacing: 1.5 }}>Pre-ordered food</Text>
              <View className="gap-1.5">
                {(d.pre_order as { name: string; price: number; quantity: number }[]).map((item, i) => (
                  <View key={i} className="flex-row items-center justify-between">
                    <Text className="text-[13px] text-amber-900">{item.quantity}× {item.name}</Text>
                    <Text className="text-[13px] font-bold text-amber-900">{rupees(item.price * item.quantity)}</Text>
                  </View>
                ))}
                <View className="mt-1.5 border-t border-amber-200 pt-1.5 flex-row items-center justify-between">
                  <Text className="text-[13px] font-bold text-amber-900">Total</Text>
                  <Text className="text-[14px] font-bold text-amber-900">
                    {rupees((d.pre_order as { price: number; quantity: number }[]).reduce((s, i) => s + i.price * i.quantity, 0))}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="rounded-2xl bg-blue-50 p-4">
            <Text className="mb-2 text-[11px] font-bold uppercase text-blue-700" style={{ letterSpacing: 1.5 }}>Table availability</Text>
            {availableTables.length > 0 ? (
              <View className="gap-1">
                <Text className="text-[13px] font-bold text-blue-900">{availableTables.length} tables available for {d.guests ?? 2}+ guests</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {availableTables.slice(0, 8).map((t) => (
                    <View key={t.id} className="rounded-lg bg-white px-2.5 py-1">
                      <Text className="text-[11px] font-bold text-blue-700">T{t.number} · {t.seats} seats · {t.zone}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text className="text-[13px] text-blue-800">No tables currently available for this party size. You can still confirm manually.</Text>
            )}
          </View>

          {showDecline ? (
            <View className="gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <Text className="text-[14px] font-bold text-red-900">Decline reservation</Text>
              <Input
                label="Reason (optional, sent to guest)"
                value={declineNote}
                onChangeText={setDeclineNote}
                multiline
                numberOfLines={2}
                placeholder="e.g. Fully booked at that time..."
              />
              <View className="flex-row gap-3">
                <Button label="Cancel" variant="secondary" onPress={() => setShowDecline(false)} />
                <View className="flex-1">
                  <Button label="Decline booking" loading={responding} onPress={() => onDecline(d.booking_id as string, declineNote || undefined)} fullWidth />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Confirm reservation" loading={responding} onPress={() => onConfirm(d.booking_id as string)} fullWidth />
              </View>
              <View className="flex-1">
                <Button label="Decline" variant="secondary" onPress={() => setShowDecline(true)} fullWidth />
              </View>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <Icon name={icon} size={14} color="#8A8A8A" />
      <Text className="w-20 text-[12px] text-dime-ink-3">{label}</Text>
      <Text className="flex-1 text-[13px] font-bold text-dime-ink">{value}</Text>
    </View>
  );
}

