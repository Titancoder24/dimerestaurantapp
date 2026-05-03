// Module 6 — Wastage / Spoilage Log
import { useState, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useWastage, useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const REASONS = ["spoilage", "spillage", "staff_meal", "comp", "breakage", "overcooked", "other"];
const REASON_DOT: Record<string, string> = {
  spoilage: "#D43A2F", spillage: "#D97706", staff_meal: "#0F8A4F",
  comp: "#3358D4", breakage: "#A1A09A", overcooked: "#D97706", other: OWNER_MUTED,
};

export default function Wastage() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: logs } = useWastage(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("wastage_logs", ["wastage"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("g");
  const [cost, setCost] = useState("");
  const [reason, setReason] = useState("spoilage");
  const [notes, setNotes] = useState("");

  const totalToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (logs ?? [])
      .filter((l) => l.created_at.slice(0, 10) === today)
      .reduce((s, l) => s + Number(l.cost), 0);
  }, [logs]);

  const create = async () => {
    if (!restaurant?.id || !desc.trim()) return;
    await insert.mutateAsync({
      restaurant_id: restaurant.id,
      description: desc.trim(),
      qty: Number(qty) || 1, unit,
      cost: Number(cost) || 0,
      reason, notes: notes.trim() || null,
      recorded_by: me?.id ?? null,
    });
    setShowAdd(false); setDesc(""); setQty("1"); setCost(""); setNotes("");
    toast.success("Logged");
  };

  return (
    <PageScroll>
      <PageHeader title="Wastage log" subtitle="Track spoilage, spills, comps. Drives food-cost % accuracy." rightAction="Log waste" actionIcon="plus" onAction={() => setShowAdd(true)} />

      {(() => {
        const all = logs ?? [];
        const today = new Date().toISOString().slice(0, 10);
        const thisMonth = today.slice(0, 7);
        const monthCost = all.filter((l) => l.created_at.startsWith(thisMonth)).reduce((s, l) => s + Number(l.cost), 0);
        const todayCount = all.filter((l) => l.created_at.slice(0, 10) === today).length;
        const topReason = (() => {
          const counts: Record<string, number> = {};
          for (const l of all) counts[l.reason] = (counts[l.reason] ?? 0) + 1;
          const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          return arr[0]?.[0] ?? "—";
        })();
        return (
          <StatRow>
            <StatTile icon="indianrupeesign.circle.fill" iconColor={totalToday > 1000 ? "#D43A2F" : "#0F8A4F"} iconBg={totalToday > 1000 ? "#FCEAE6" : "#E6F4ED"} label="Write-off · today" value={`₹${totalToday.toLocaleString("en-IN")}`} hint={`${todayCount} entries logged`} />
            <StatTile icon="calendar" iconColor="#D97706" iconBg="#FFF7E0" label="This month" value={`₹${monthCost.toLocaleString("en-IN")}`} hint="Cumulative cost" />
            <StatTile icon="exclamationmark.triangle.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Top reason" value={topReason.replace("_", " ")} hint="Most logged" />
            <StatTile icon="trash.fill" label="Total entries" value={String(all.length)} hint="All-time" />
          </StatRow>
        );
      })()}

      <CardShell>
        <CardHeader title="Recent entries" subtitle={`${(logs ?? []).length} total`} />
        {(logs ?? []).length === 0 ? (
          <EmptyState
            icon="trash.fill"
            title="Nothing wasted — yet"
            body="Log spoilage, spills, staff meals and comps. Each entry adjusts food-cost % so your COGS reporting reflects reality, not just sales."
            actionLabel="Log first wastage"
            onAction={() => setShowAdd(true)}
          />
        ) : null}
        {(logs ?? []).map((l, i) => (
          <View key={l.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={REASON_DOT[l.reason] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{l.description ?? "—"}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {l.qty} {l.unit} · {l.reason.replace("_", " ")}
              </MonoText>
            </View>
            <MonoText size={13} weight="700">₹{Number(l.cost).toLocaleString("en-IN")}</MonoText>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Log wastage</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="What was wasted?" value={desc} onChangeText={setDesc} placeholder="e.g. Mozzarella" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Qty" value={qty} onChangeText={setQty} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Unit" value={unit} onChangeText={setUnit} /></View>
              <View style={{ flex: 1 }}><Input label="Cost ₹" value={cost} onChangeText={setCost} keyboardType="decimal-pad" /></View>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>REASON</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {REASONS.map((r) => (
                <Pressable key={r} onPress={() => setReason(r)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: reason === r ? OWNER_INK : "#fff", borderWidth: 1, borderColor: reason === r ? OWNER_INK : OWNER_HAIRLINE }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: reason === r ? "#fff" : OWNER_INK, textTransform: "capitalize" }}>{r.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
            <Button label="Save entry" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
