// Module 17 — Private events / banquets
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useBanquets } from "@/hooks/management_extras";
import { useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const TYPES = ["birthday", "anniversary", "corporate", "wedding", "engagement", "reception", "other"] as const;
const STATUS_DOT: Record<string, string> = {
  inquiry: "#A1A09A", quoted: "#D97706", confirmed: "#0F8A4F",
  completed: OWNER_ACCENT, cancelled: "#D43A2F",
};

export default function Banquets() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: events } = useBanquets(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("banquet_events", ["banquets"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [cName, setCName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("20");
  const [type, setType] = useState<typeof TYPES[number]>("birthday");
  const [quote, setQuote] = useState("");

  const list = events ?? [];
  const upcoming = list.filter((e) => new Date(e.event_date).getTime() >= Date.now() && e.status !== "cancelled").length;
  const confirmedRev = list.filter((e) => e.status === "confirmed" || e.status === "completed").reduce((s, e) => s + Number(e.total_quote), 0);
  const balance = list.reduce((s, e) => s + Number(e.balance_due), 0);

  const create = async () => {
    if (!restaurant?.id || !cName.trim() || !date.trim()) return;
    try {
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        customer_name: cName.trim(),
        phone: phone.trim() || null,
        event_date: date.trim(),
        guest_count: Number(guests) || 10,
        event_type: type,
        total_quote: Number(quote) || 0,
        status: "inquiry",
        created_by: me?.id ?? null,
      });
      setShowAdd(false); setCName(""); setPhone(""); setDate(""); setQuote("");
      toast.success("Inquiry logged");
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Private events" subtitle="Birthdays, corporates, anniversaries, weddings." rightAction="New inquiry" actionIcon="plus" onAction={() => setShowAdd(true)} />

      <StatRow>
        <StatTile icon="calendar" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Upcoming" value={String(upcoming)} hint="Confirmed + quoted" />
        <StatTile icon="indianrupeesign.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Confirmed value" value={`₹${confirmedRev.toLocaleString("en-IN")}`} hint="Locked-in revenue" />
        <StatTile icon="hourglass" iconColor="#D97706" iconBg="#FFF7E0" label="Balance due" value={`₹${balance.toLocaleString("en-IN")}`} hint="Awaiting collection" />
        <StatTile icon="person.3.fill" label="Total events" value={String(list.length)} hint="All-time inquiries" />
      </StatRow>

      <CardShell>
        <CardHeader title="Pipeline" subtitle={`${list.length} events`} />
        {list.length === 0 ? (
          <EmptyState icon="sparkles" title="Build a private-events pipeline" body="Capture inquiries, quote packages, lock confirmations with a deposit. Ideal for birthdays, anniversaries, corporate offsites and wedding receptions." actionLabel="Log first inquiry" onAction={() => setShowAdd(true)} />
        ) : null}
        {list.map((e, i) => (
          <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={STATUS_DOT[e.status] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{e.customer_name} · {e.guest_count} guests</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {e.event_type.toUpperCase()} · {e.event_date}{e.phone ? ` · ${e.phone}` : ""}
              </MonoText>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <MonoText size={13} weight="700">₹{Number(e.total_quote).toLocaleString("en-IN")}</MonoText>
              <Text style={{ fontSize: 10, fontWeight: "700", color: STATUS_DOT[e.status] ?? OWNER_INK2, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {e.status}
              </Text>
            </View>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>New event inquiry</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <Input label="Customer name" value={cName} onChangeText={setCName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Event date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" /></View>
              <View style={{ flex: 1 }}><Input label="Guest count" value={guests} onChangeText={setGuests} keyboardType="number-pad" /></View>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>EVENT TYPE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {TYPES.map((t) => (
                <Pressable key={t} onPress={() => setType(t)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: type === t ? OWNER_INK : "#fff", borderWidth: 1, borderColor: type === t ? OWNER_INK : OWNER_HAIRLINE }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: type === t ? "#fff" : OWNER_INK, textTransform: "capitalize" }}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Quote ₹ (estimated)" value={quote} onChangeText={setQuote} keyboardType="decimal-pad" />
            <Button label="Save inquiry" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
