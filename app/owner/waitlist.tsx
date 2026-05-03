// Module 9 — Waitlist
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useWaitlist, useInsert, useUpdate, type WaitlistRow } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const STATUS_DOT: Record<string, string> = {
  waiting: "#D97706", ready: "#0F8A4F", seated: "#A1A09A", left: "#D43A2F", no_show: "#D43A2F",
};

export default function Waitlist() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: waitlist } = useWaitlist(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("waitlist_entries", ["waitlist"]);
  const update = useUpdate<Record<string, unknown>>("waitlist_entries", ["waitlist"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("2");
  const [wait, setWait] = useState("15");

  const create = async () => {
    if (!restaurant?.id || !name.trim()) return;
    await insert.mutateAsync({
      restaurant_id: restaurant.id,
      guest_name: name.trim(),
      phone: phone.trim() || null,
      party_size: Number(size) || 2,
      estimated_wait_min: Number(wait) || 15,
      status: "waiting",
      added_by: me?.id ?? null,
    });
    setShowAdd(false); setName(""); setPhone("");
    toast.success("Added to waitlist");
  };

  const transition = async (e: WaitlistRow, next: string) => {
    const patch: Record<string, unknown> = { status: next };
    if (next === "ready") patch.notified_at = new Date().toISOString();
    if (next === "seated") patch.seated_at = new Date().toISOString();
    if (next === "left" || next === "no_show") patch.left_at = new Date().toISOString();
    await update.mutateAsync({ id: e.id, patch });
    toast.success(`Marked ${next}`);
  };

  return (
    <PageScroll>
      <PageHeader title="Waitlist" subtitle="Walk-in guests, estimated wait, ready notifications." rightAction="Add guest" actionIcon="plus" onAction={() => setShowAdd(true)} />

      {(() => {
        const list = waitlist ?? [];
        const waiting = list.filter((e) => e.status === "waiting").length;
        const ready = list.filter((e) => e.status === "ready").length;
        const totalGuests = list.reduce((s, e) => s + Number(e.party_size), 0);
        const avgWait = list.length === 0 ? 0 : Math.round(list.reduce((s, e) => s + Number(e.estimated_wait_min ?? 0), 0) / list.length);
        return (
          <StatRow>
            <StatTile icon="hourglass" iconColor="#D97706" iconBg="#FFF7E0" label="Waiting" value={String(waiting)} hint="Yet to be notified" />
            <StatTile icon="bell.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Ready" value={String(ready)} hint="Notified, awaiting seat" />
            <StatTile icon="person.3.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Guests in queue" value={String(totalGuests)} hint="Total covers waiting" />
            <StatTile icon="clock.fill" label="Avg wait" value={`${avgWait}m`} hint="Estimated minutes" />
          </StatRow>
        );
      })()}

      <CardShell>
        <CardHeader title="Live queue" subtitle={`${(waitlist ?? []).length} active`} />
        {(waitlist ?? []).length === 0 ? (
          <EmptyState
            icon="person.3.fill"
            title="Queue is clear"
            body="Add walk-in guests with party size and estimated wait. When the table's ready, hit Notify — they get an SMS / WhatsApp ping."
            actionLabel="Add walk-in guest"
            onAction={() => setShowAdd(true)}
          />
        ) : null}
        {(waitlist ?? []).map((e, i) => (
          <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={STATUS_DOT[e.status] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{e.guest_name} · party of {e.party_size}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {e.phone ?? "no phone"} · ~{e.estimated_wait_min} min
              </MonoText>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {e.status === "waiting" ? (
                <Pressable onPress={() => transition(e, "ready")} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: OWNER_ACCENT }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Notify ready</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => transition(e, "seated")} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: OWNER_INK }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Seat</Text>
              </Pressable>
              <Pressable onPress={() => transition(e, "no_show")} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: OWNER_HAIRLINE }}>
                <Icon name="xmark" size={11} color={OWNER_INK} />
              </Pressable>
            </View>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Add to waitlist</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="Guest name" value={name} onChangeText={setName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Party size" value={size} onChangeText={setSize} keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Wait (min)" value={wait} onChangeText={setWait} keyboardType="number-pad" /></View>
            </View>
            <Button label="Add" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
