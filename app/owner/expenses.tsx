// Module 12 — Expenses & P&L
import { useState, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantOrders } from "@/hooks/owner";
import { useExpenses } from "@/hooks/management_extras";
import { useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const CATEGORIES = ["rent", "salaries", "utilities", "supplies", "marketing", "repairs", "licences", "misc"];
const CAT_DOT: Record<string, string> = {
  rent: "#6F5BFF", salaries: "#0F8A4F", utilities: "#3358D4", supplies: "#D97706",
  marketing: "#D43A2F", repairs: "#A1A09A", licences: "#FF5A1F", misc: OWNER_MUTED,
};

export default function Expenses() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: expenses } = useExpenses(restaurant?.id);
  const { data: orders } = useRestaurantOrders(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("expenses", ["expenses"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [cat, setCat] = useState("misc");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [desc, setDesc] = useState("");

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthExpenses = useMemo(() => (expenses ?? []).filter((e) => (e.date ?? "").startsWith(monthKey)), [expenses, monthKey]);
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthRevenue = (orders ?? []).filter((o) => (o.created_at ?? "").startsWith(monthKey)).reduce((s, o) => s + Number(o.total_amount), 0);
  const profit = monthRevenue - monthTotal;
  const margin = monthRevenue > 0 ? (profit / monthRevenue) * 100 : 0;

  const create = async () => {
    if (!restaurant?.id || !amount) return;
    try {
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        category: cat, amount: Number(amount) || 0,
        vendor_name: vendor.trim() || null,
        description: desc.trim() || null,
        date: new Date().toISOString().slice(0, 10),
        recorded_by: me?.id ?? null,
      });
      setShowAdd(false); setAmount(""); setVendor(""); setDesc("");
      toast.success("Expense logged");
    } catch (e) {
      toast.error("Could not log", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Expenses & P&L" subtitle="Track operational costs against revenue." rightAction="Log expense" actionIcon="plus" onAction={() => setShowAdd(true)} />

      <StatRow>
        <StatTile icon="indianrupeesign.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Revenue (mo)" value={`₹${monthRevenue.toLocaleString("en-IN")}`} hint="Orders this month" />
        <StatTile icon="arrow.up.arrow.down" iconColor="#D43A2F" iconBg="#FCEAE6" label="Expenses (mo)" value={`₹${monthTotal.toLocaleString("en-IN")}`} hint={`${monthExpenses.length} entries`} />
        <StatTile icon="chart.line.uptrend.xyaxis" iconColor={profit >= 0 ? "#0F8A4F" : "#D43A2F"} iconBg={profit >= 0 ? "#E6F4ED" : "#FCEAE6"} label="Net P&L" value={`₹${profit.toLocaleString("en-IN")}`} hint={`${margin.toFixed(1)}% margin`} />
        <StatTile icon="percent" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Burn ratio" value={`${monthRevenue > 0 ? ((monthTotal / monthRevenue) * 100).toFixed(0) : "—"}%`} hint="Expenses ÷ revenue" />
      </StatRow>

      <CardShell>
        <CardHeader title="Recent expenses" subtitle={`${(expenses ?? []).length} entries`} />
        {(expenses ?? []).length === 0 ? (
          <EmptyState icon="indianrupeesign.circle.fill" title="No expenses tracked yet" body="Log rent, salaries, utilities and supplies. The P&L tile updates instantly so you see the margin pressure as it builds." actionLabel="Log first expense" onAction={() => setShowAdd(true)} />
        ) : null}
        {(expenses ?? []).map((e, i) => (
          <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={CAT_DOT[e.category] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{e.description ?? e.vendor_name ?? e.category}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {e.category.toUpperCase()} · {e.date} {e.vendor_name ? `· ${e.vendor_name}` : ""}
              </MonoText>
            </View>
            <MonoText size={13} weight="700">₹{Number(e.amount).toLocaleString("en-IN")}</MonoText>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Log expense</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <Input label="Amount ₹" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Input label="Vendor (optional)" value={vendor} onChangeText={setVendor} />
            <Input label="Description" value={desc} onChangeText={setDesc} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>CATEGORY</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCat(c)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: cat === c ? OWNER_INK : "#fff", borderWidth: 1, borderColor: cat === c ? OWNER_INK : OWNER_HAIRLINE, flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: CAT_DOT[c] ?? OWNER_MUTED }} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: cat === c ? "#fff" : OWNER_INK, textTransform: "capitalize" }}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Button label="Save expense" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
