// Module 8 — Tip Pool
import { useState, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useTips, useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const SOURCES = ["cash", "card", "upi"];
const SOURCE_DOT: Record<string, string> = { cash: "#0F8A4F", card: "#3358D4", upi: OWNER_ACCENT };

export default function Tips() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: tips } = useTips(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("tip_entries", ["tips"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("cash");

  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = useMemo(
    () => (tips ?? []).filter((t) => t.business_date === today).reduce((s, t) => s + Number(t.amount), 0),
    [tips, today]
  );
  const myTotal = useMemo(
    () => (tips ?? []).filter((t) => t.user_id === me?.id && t.business_date === today).reduce((s, t) => s + Number(t.amount), 0),
    [tips, me, today]
  );

  const create = async () => {
    if (!restaurant?.id || !me?.id || !amount) return;
    await insert.mutateAsync({
      restaurant_id: restaurant.id,
      user_id: me.id,
      business_date: today,
      amount: Number(amount) || 0,
      source,
      recorded_by: me.id,
    });
    setShowAdd(false); setAmount("");
    toast.success("Tip recorded");
  };

  return (
    <PageScroll>
      <PageHeader title="Tips" subtitle="Servers record tips, owner sees the pool." rightAction="Record tip" actionIcon="plus" onAction={() => setShowAdd(true)} />

      {(() => {
        const all = tips ?? [];
        const monthTotal = all.filter((t) => t.business_date.startsWith(today.slice(0, 7))).reduce((s, t) => s + Number(t.amount), 0);
        const cashShare = all.filter((t) => t.business_date === today && t.source === "cash").reduce((s, t) => s + Number(t.amount), 0);
        return (
          <StatRow>
            <StatTile icon="indianrupeesign.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Pool · today" value={`₹${todayTotal.toLocaleString("en-IN")}`} hint={`${all.filter((t) => t.business_date === today).length} tips today`} />
            <StatTile icon="person.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Your share · today" value={`₹${myTotal.toLocaleString("en-IN")}`} hint="Tips you logged" />
            <StatTile icon="banknote.fill" label="Cash today" value={`₹${cashShare.toLocaleString("en-IN")}`} hint="Cash tips received" />
            <StatTile icon="calendar" iconColor="#D97706" iconBg="#FFF7E0" label="This month" value={`₹${monthTotal.toLocaleString("en-IN")}`} hint="Pool month-to-date" />
          </StatRow>
        );
      })()}

      <CardShell>
        <CardHeader title="Recent tips" subtitle={`${(tips ?? []).length} entries`} />
        {(tips ?? []).length === 0 ? (
          <EmptyState
            icon="indianrupeesign.circle.fill"
            title="No tips recorded yet"
            body="Servers tap Record tip after each shift. Distribute the pool fairly with full audit history of cash, card and UPI gratuities."
            actionLabel="Record tip"
            onAction={() => setShowAdd(true)}
          />
        ) : null}
        {(tips ?? []).map((t, i) => (
          <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={SOURCE_DOT[t.source] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{t.user?.name ?? "—"}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {t.business_date} · {t.source.toUpperCase()}
              </MonoText>
            </View>
            <MonoText size={13} weight="700">₹{Number(t.amount).toLocaleString("en-IN")}</MonoText>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Record tip</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>SOURCE</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {SOURCES.map((s) => (
                <Pressable key={s} onPress={() => setSource(s)} style={{ flex: 1, paddingVertical: 10, borderRadius: 7, backgroundColor: source === s ? OWNER_INK : "#fff", borderWidth: 1, borderColor: source === s ? OWNER_INK : OWNER_HAIRLINE, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: source === s ? "#fff" : OWNER_INK, textTransform: "uppercase", letterSpacing: 0.4 }}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <Button label="Record" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
