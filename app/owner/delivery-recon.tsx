// Module 18 — Delivery aggregator reconciliation (Swiggy / Zomato / etc.)
import { useState, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useDeliveryRecons } from "@/hooks/management_extras";
import { useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const PLATFORMS = ["swiggy", "zomato", "dunzo", "magicpin", "other"] as const;
const PLAT_DOT: Record<string, string> = {
  swiggy: "#FF5A1F", zomato: "#D43A2F", dunzo: "#FFB088",
  magicpin: "#6F5BFF", other: OWNER_MUTED,
};

export default function DeliveryRecon() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: recons } = useDeliveryRecons(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("delivery_reconciliations", ["delivery-recon"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>("swiggy");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [gross, setGross] = useState("");
  const [orderCount, setOrderCount] = useState("");
  const [commPct, setCommPct] = useState("25");
  const [delivery, setDelivery] = useState("0");

  const list = recons ?? [];
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthRows = useMemo(() => list.filter((r) => r.business_date.startsWith(monthKey)), [list, monthKey]);
  const monthGross = monthRows.reduce((s, r) => s + Number(r.gross_sales), 0);
  const monthNet = monthRows.reduce((s, r) => s + Number(r.net_payout), 0);
  const monthCommission = monthRows.reduce((s, r) => s + Number(r.commission_amount), 0);
  const platforms = new Set(monthRows.map((r) => r.platform)).size;

  const create = async () => {
    if (!restaurant?.id || !gross) return;
    try {
      const grossN = Number(gross) || 0;
      const pct = Number(commPct) || 0;
      const commission = Math.round((grossN * pct) / 100 * 100) / 100;
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        platform, business_date: date,
        gross_sales: grossN,
        order_count: Number(orderCount) || 0,
        commission_pct: pct, commission_amount: commission,
        delivery_fees: Number(delivery) || 0,
        recorded_by: me?.id ?? null,
      });
      setShowAdd(false); setGross(""); setOrderCount(""); setDelivery("0");
      toast.success("Day reconciled");
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Delivery reconciliation" subtitle="Swiggy / Zomato payouts vs gross sales." rightAction="Reconcile day" actionIcon="plus" onAction={() => setShowAdd(true)} />

      <StatRow>
        <StatTile icon="indianrupeesign.circle.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Gross (mo)" value={`₹${monthGross.toLocaleString("en-IN")}`} hint="Across all platforms" />
        <StatTile icon="arrow.up.arrow.down" iconColor="#D43A2F" iconBg="#FCEAE6" label="Commission paid" value={`₹${monthCommission.toLocaleString("en-IN")}`} hint={`${monthGross > 0 ? ((monthCommission / monthGross) * 100).toFixed(1) : "—"}% of gross`} />
        <StatTile icon="checkmark.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Net payout" value={`₹${monthNet.toLocaleString("en-IN")}`} hint="What you actually take home" />
        <StatTile icon="globe" iconBg="#E6EDFA" iconColor="#3358D4" label="Platforms" value={String(platforms)} hint="Active this month" />
      </StatRow>

      <CardShell>
        <CardHeader title="Reconciled days" subtitle={`${list.length} entries`} />
        {list.length === 0 ? (
          <EmptyState icon="globe" title="Track aggregator payouts" body="Reconcile your daily Swiggy and Zomato payouts. The dashboard splits gross sales, commission, delivery fees and refunds — so you know exactly what hits your bank." actionLabel="Reconcile first day" onAction={() => setShowAdd(true)} />
        ) : null}
        {list.map((r, i) => (
          <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={PLAT_DOT[r.platform] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>
                {r.platform.toUpperCase()} · {r.business_date}
              </Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {r.order_count} orders · gross ₹{Number(r.gross_sales).toLocaleString("en-IN")} · commission ₹{Number(r.commission_amount).toLocaleString("en-IN")}
              </MonoText>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <MonoText size={13} weight="700" color="#0F8A4F">₹{Number(r.net_payout).toLocaleString("en-IN")}</MonoText>
              <Text style={{ fontSize: 10, color: OWNER_MUTED, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>NET</Text>
            </View>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Reconcile day</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>PLATFORM</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {PLATFORMS.map((p) => (
                <Pressable key={p} onPress={() => setPlatform(p)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: platform === p ? OWNER_INK : "#fff", borderWidth: 1, borderColor: platform === p ? OWNER_INK : OWNER_HAIRLINE, flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: PLAT_DOT[p] }} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: platform === p ? "#fff" : OWNER_INK, textTransform: "capitalize" }}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Business date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Gross sales ₹" value={gross} onChangeText={setGross} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Orders" value={orderCount} onChangeText={setOrderCount} keyboardType="number-pad" /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Commission %" value={commPct} onChangeText={setCommPct} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Delivery fees ₹" value={delivery} onChangeText={setDelivery} keyboardType="decimal-pad" /></View>
            </View>
            <Button label="Save day" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
