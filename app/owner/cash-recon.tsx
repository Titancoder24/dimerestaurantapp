// Module 3 — Daily Cash Reconciliation
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useCashRecons, useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

export default function CashRecon() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: recons } = useCashRecons(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("cash_reconciliations", ["cash-recons"]);
  const toast = useToast();

  const [expCash, setExpCash] = useState("");
  const [expCard, setExpCard] = useState("");
  const [expUpi, setExpUpi] = useState("");
  const [cntCash, setCntCash] = useState("");
  const [cntCard, setCntCard] = useState("");
  const [cntUpi, setCntUpi] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = (recons ?? []).find((r) => r.business_date === today);

  const close = async () => {
    if (!restaurant?.id) return;
    try {
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        business_date: today,
        expected_cash: Number(expCash) || 0,
        expected_card: Number(expCard) || 0,
        expected_upi: Number(expUpi) || 0,
        counted_cash: Number(cntCash) || 0,
        counted_card: Number(cntCard) || 0,
        counted_upi: Number(cntUpi) || 0,
        notes: notes.trim() || null,
        status: "closed",
        closed_by: me?.id ?? null,
        closed_at: new Date().toISOString(),
      });
      toast.success("Day closed");
      setExpCash(""); setExpCard(""); setExpUpi(""); setCntCash(""); setCntCard(""); setCntUpi(""); setNotes("");
    } catch (e) {
      toast.error("Could not close", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Cash reconciliation" subtitle="End-of-day count, variance against expected revenue." />

      {(() => {
        const all = recons ?? [];
        const monthCloses = all.filter((r) => r.business_date.startsWith(today.slice(0, 7))).length;
        const totalVariance = all.slice(0, 30).reduce((s, r) => s + Number(r.variance), 0);
        const lastClose = all[0];
        return (
          <StatRow>
            <StatTile icon="calendar" label="Status today" value={todayRow ? "Closed" : "Open"} hint={todayRow ? "Day reconciled" : "Awaiting close"} />
            <StatTile icon="checkmark.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Closes this month" value={String(monthCloses)} hint="Days reconciled" />
            <StatTile
              icon="arrow.up.arrow.down"
              iconColor={Math.abs(totalVariance) > 500 ? "#D43A2F" : "#0F8A4F"}
              iconBg={Math.abs(totalVariance) > 500 ? "#FCEAE6" : "#E6F4ED"}
              label="30-day variance"
              value={`${totalVariance >= 0 ? "+" : ""}₹${Math.abs(totalVariance).toLocaleString("en-IN")}`}
              hint="Sum across closes"
            />
            <StatTile icon="clock.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Last close" value={lastClose ? lastClose.business_date : "—"} hint={lastClose?.closed_at ? new Date(lastClose.closed_at).toLocaleString() : "No closes yet"} />
          </StatRow>
        );
      })()}

      {!todayRow ? (
        <CardShell>
          <CardHeader title="Close today" subtitle="Enter expected & counted amounts" />
          <View style={{ padding: 18, gap: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>EXPECTED</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Cash" value={expCash} onChangeText={setExpCash} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Card" value={expCard} onChangeText={setExpCard} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="UPI" value={expUpi} onChangeText={setExpUpi} keyboardType="decimal-pad" /></View>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>COUNTED</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Cash" value={cntCash} onChangeText={setCntCash} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Card" value={cntCard} onChangeText={setCntCard} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="UPI" value={cntUpi} onChangeText={setCntUpi} keyboardType="decimal-pad" /></View>
            </View>
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
            <Button label="Close day" onPress={close} loading={insert.isPending} />
          </View>
        </CardShell>
      ) : (
        <CardShell>
          <CardHeader title="Today closed" subtitle={todayRow.closed_at ? new Date(todayRow.closed_at).toLocaleString() : ""} />
          <View style={{ padding: 18 }}>
            <Text style={{ fontSize: 13, color: OWNER_INK2 }}>
              Variance: <MonoText size={14} weight="700" color={Number(todayRow.variance) === 0 ? "#0F8A4F" : "#D43A2F"}>₹{Number(todayRow.variance).toFixed(2)}</MonoText>
            </Text>
          </View>
        </CardShell>
      )}

      <CardShell>
        <CardHeader title="History" subtitle={`${(recons ?? []).length} closes`} />
        {(recons ?? []).length === 0 ? (
          <EmptyState
            icon="indianrupeesign.circle.fill"
            title="No day closes yet"
            body="Reconcile cash, card and UPI at end of every shift. The variance column flags missing money before it disappears in the noise."
            compact
          />
        ) : null}
        {(recons ?? []).map((r, i) => (
          <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={Number(r.variance) === 0 ? "#0F8A4F" : Math.abs(Number(r.variance)) > 100 ? "#D43A2F" : "#D97706"} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{r.business_date}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                Cash ₹{r.counted_cash} · Card ₹{r.counted_card} · UPI ₹{r.counted_upi}
              </MonoText>
            </View>
            <MonoText size={13} weight="700" color={Number(r.variance) >= 0 ? "#0F8A4F" : "#D43A2F"}>
              {Number(r.variance) >= 0 ? "+" : ""}₹{Number(r.variance).toFixed(0)}
            </MonoText>
          </View>
        ))}
      </CardShell>
    </PageScroll>
  );
}
