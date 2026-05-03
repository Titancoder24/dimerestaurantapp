// Module 4 — Recipes & Food Cost
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useRecipes, useInsert } from "@/hooks/management";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

export default function Recipes() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: recipes } = useRecipes(restaurant?.id);
  const insertRecipe = useInsert<Record<string, unknown>>("recipes", ["recipes"]);
  const insertIng = useInsert<Record<string, unknown>>("recipe_ingredients", ["recipes"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [yieldQty, setYieldQty] = useState("1");
  const [yieldUnit, setYieldUnit] = useState("serving");
  const [notes, setNotes] = useState("");
  const [ingDesc, setIngDesc] = useState("");
  const [ingQty, setIngQty] = useState("");
  const [ingUnit, setIngUnit] = useState("g");
  const [ingCost, setIngCost] = useState("");

  const create = async () => {
    if (!restaurant?.id) return;
    try {
      const recipe = await insertRecipe.mutateAsync({
        restaurant_id: restaurant.id,
        yield_qty: Number(yieldQty) || 1,
        yield_unit: yieldUnit,
        notes: notes.trim() || null,
      });
      if (ingDesc && ingQty) {
        await insertIng.mutateAsync({
          recipe_id: (recipe as { id: string }).id,
          description: ingDesc.trim(),
          qty: Number(ingQty) || 1,
          unit: ingUnit,
          unit_cost: Number(ingCost) || 0,
        });
      }
      setShowAdd(false); setNotes(""); setIngDesc(""); setIngQty(""); setIngCost("");
      toast.success("Recipe added");
    } catch (e) {
      toast.error("Could not add", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Recipes & food cost" subtitle="Auto-compute COGS by linking inventory to menu items." rightAction="New recipe" actionIcon="plus" onAction={() => setShowAdd(true)} />

      {(() => {
        const list = recipes ?? [];
        const totalCost = list.reduce((s, r) => s + (r.total_cost ?? 0), 0);
        const avgFc = list.length === 0 ? 0 : list.reduce((s, r) => {
          const price = Number(r.menu_item?.price ?? 0);
          if (price === 0) return s;
          return s + ((r.total_cost ?? 0) / price) * 100;
        }, 0) / Math.max(1, list.filter((r) => r.menu_item).length);
        const overTarget = list.filter((r) => {
          const price = Number(r.menu_item?.price ?? 0);
          return price > 0 && ((r.total_cost ?? 0) / price) > 0.35;
        }).length;
        return (
          <StatRow>
            <StatTile icon="scale.3d" label="Recipes on file" value={String(list.length)} hint="Linked to menu items" />
            <StatTile icon="percent" iconColor="#D97706" iconBg="#FFF7E0" label="Avg food cost" value={`${avgFc.toFixed(1)}%`} hint="Target 28-32%" />
            <StatTile icon="indianrupeesign.circle.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Total recipe cost" value={`₹${totalCost.toFixed(0)}`} hint="Sum of all ingredient costs" />
            <StatTile icon="exclamationmark.triangle.fill" iconColor={overTarget > 0 ? "#D43A2F" : "#0F8A4F"} iconBg={overTarget > 0 ? "#FCEAE6" : "#E6F4ED"} label="Over 35% target" value={String(overTarget)} hint="Recipes to optimise" />
          </StatRow>
        );
      })()}

      <CardShell>
        <CardHeader title="All recipes" subtitle={`${(recipes ?? []).length} on file`} />
        {(recipes ?? []).length === 0 ? (
          <EmptyState
            icon="scale.3d"
            title="Build your first recipe"
            body="Link inventory items to menu dishes with quantities and unit costs. Food cost % auto-computes from sale price — green under 28%, red over 35%."
            actionLabel="Create recipe"
            onAction={() => setShowAdd(true)}
          />
        ) : null}
        {(recipes ?? []).map((r, i) => {
          const price = r.menu_item?.price ?? 0;
          const cost = r.total_cost ?? 0;
          const fcPct = price > 0 ? Math.round((cost / Number(price)) * 100) : 0;
          return (
            <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{r.menu_item?.name ?? "Unlinked recipe"}</Text>
                <MonoText size={11} color={OWNER_MUTED}>
                  Yields {r.yield_qty} {r.yield_unit} · Cost ₹{cost.toFixed(2)} · Sells ₹{price}
                </MonoText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <MonoText size={14} weight="700" color={fcPct > 35 ? "#D43A2F" : fcPct > 28 ? "#D97706" : "#0F8A4F"}>
                  {fcPct}%
                </MonoText>
                <Text style={{ fontSize: 10, color: OWNER_MUTED }}>food cost</Text>
              </View>
            </View>
          );
        })}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>New recipe</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Yield qty" value={yieldQty} onChangeText={setYieldQty} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Unit" value={yieldUnit} onChangeText={setYieldUnit} /></View>
            </View>
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>FIRST INGREDIENT (OPTIONAL)</Text>
            <Input label="Description" value={ingDesc} onChangeText={setIngDesc} placeholder="e.g. Mozzarella" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Qty" value={ingQty} onChangeText={setIngQty} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1 }}><Input label="Unit" value={ingUnit} onChangeText={setIngUnit} /></View>
              <View style={{ flex: 1 }}><Input label="₹/unit" value={ingCost} onChangeText={setIngCost} keyboardType="decimal-pad" /></View>
            </View>
            <Button label="Save recipe" onPress={create} loading={insertRecipe.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
