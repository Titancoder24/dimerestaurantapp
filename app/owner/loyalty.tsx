// Module 11 — Loyalty programs & rewards
import { useState, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useLoyalty } from "@/hooks/management_extras";
import { useInsert } from "@/hooks/management";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatRow, StatTile,
  OWNER_INK, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

export default function Loyalty() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data, refetch } = useLoyalty(restaurant?.id);
  const insertReward = useInsert<Record<string, unknown>>("loyalty_rewards", ["loyalty"]);
  const toast = useToast();

  const program = data?.program ?? null;
  const rewards = data?.rewards ?? [];
  const [pts, setPts] = useState("0.05");
  const [redeem, setRedeem] = useState("0.5");
  const [bday, setBday] = useState("100");
  useEffect(() => {
    if (program) {
      setPts(String(program.points_per_rupee));
      setRedeem(String(program.redemption_rate));
      setBday(String(program.birthday_bonus_pts));
    }
  }, [program?.id]);

  const [showAdd, setShowAdd] = useState(false);
  const [rName, setRName] = useState("");
  const [rPts, setRPts] = useState("250");
  const [rType, setRType] = useState<"discount_pct" | "discount_flat" | "free_item">("discount_pct");
  const [rValue, setRValue] = useState("10");

  const saveProgram = async () => {
    if (!restaurant?.id) return;
    try {
      if (program) {
        const { error } = await supabase.from("loyalty_programs").update({
          points_per_rupee: Number(pts), redemption_rate: Number(redeem), birthday_bonus_pts: Number(bday),
        } as never).eq("id", program.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loyalty_programs").insert({
          restaurant_id: restaurant.id,
          points_per_rupee: Number(pts), redemption_rate: Number(redeem), birthday_bonus_pts: Number(bday),
        } as never);
        if (error) throw error;
      }
      refetch();
      toast.success("Program saved");
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    }
  };

  const addReward = async () => {
    if (!restaurant?.id || !rName.trim()) return;
    await insertReward.mutateAsync({
      restaurant_id: restaurant.id,
      name: rName.trim(), points_required: Number(rPts) || 100,
      reward_type: rType, reward_value: Number(rValue) || 10, is_active: true,
    });
    setShowAdd(false); setRName(""); setRPts("250"); setRValue("10");
    refetch();
    toast.success("Reward published");
  };

  return (
    <PageScroll>
      <PageHeader title="Loyalty program" subtitle="Earn rates, tiers, redeemable rewards." rightAction="Add reward" actionIcon="plus" onAction={() => setShowAdd(true)} />

      <StatRow>
        <StatTile icon="sparkles" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Active rewards" value={String(rewards.filter((r) => r.is_active).length)} hint={`${rewards.length} on file`} />
        <StatTile icon="percent" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Earn rate" value={`${(Number(program?.points_per_rupee ?? pts) * 100).toFixed(0)}%`} hint="Points per rupee" />
        <StatTile icon="indianrupeesign.circle.fill" iconColor="#D97706" iconBg="#FFF7E0" label="Redeem rate" value={`₹${Number(program?.redemption_rate ?? redeem).toFixed(2)}`} hint="Per point" />
        <StatTile icon="gift.fill" label="Birthday bonus" value={`${program?.birthday_bonus_pts ?? bday} pts`} hint="Auto-credited" />
      </StatRow>

      <CardShell>
        <CardHeader title="Earn & redeem rules" subtitle="Tunes the points engine across your restaurant" />
        <View style={{ padding: 18, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><Input label="Points per ₹1" keyboardType="decimal-pad" value={pts} onChangeText={setPts} /></View>
            <View style={{ flex: 1 }}><Input label="₹ per 1 point" keyboardType="decimal-pad" value={redeem} onChangeText={setRedeem} /></View>
            <View style={{ flex: 1 }}><Input label="Birthday bonus (pts)" keyboardType="number-pad" value={bday} onChangeText={setBday} /></View>
          </View>
          <Button label={program ? "Update program" : "Activate program"} onPress={saveProgram} />
        </View>
      </CardShell>

      <CardShell>
        <CardHeader title="Rewards catalogue" subtitle={`${rewards.length} rewards`} />
        {rewards.length === 0 ? (
          <EmptyState icon="gift.fill" title="No rewards yet" body="Publish a reward (free dessert, 10% off, ₹150 cashback) and customers can redeem it with their points." actionLabel="Add first reward" onAction={() => setShowAdd(true)} />
        ) : null}
        {rewards.map((r, i) => (
          <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#EEEAF6", alignItems: "center", justifyContent: "center" }}>
              <Icon name="gift.fill" size={14} color={OWNER_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{r.name}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {r.points_required} PTS · {r.reward_type === "discount_pct" ? `${r.reward_value}% off` : r.reward_type === "discount_flat" ? `₹${r.reward_value} off` : `Free ${r.reward_value > 0 ? "item" : ""}`}
              </MonoText>
            </View>
            <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, backgroundColor: r.is_active ? "#E6F4ED" : "#F5F5F4" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: r.is_active ? "#0F8A4F" : OWNER_MUTED, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                {r.is_active ? "LIVE" : "OFF"}
              </Text>
            </View>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>New reward</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <Input label="Name" value={rName} onChangeText={setRName} placeholder="e.g. Free dessert" />
            <Input label="Points required" value={rPts} onChangeText={setRPts} keyboardType="number-pad" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>TYPE</Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {(["discount_pct", "discount_flat", "free_item"] as const).map((t) => (
                <Pressable key={t} onPress={() => setRType(t)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: rType === t ? OWNER_INK : "#fff", borderWidth: 1, borderColor: rType === t ? OWNER_INK : OWNER_HAIRLINE }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: rType === t ? "#fff" : OWNER_INK }}>{t.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Value (% or ₹)" value={rValue} onChangeText={setRValue} keyboardType="decimal-pad" />
            <Button label="Publish reward" onPress={addReward} loading={insertReward.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
