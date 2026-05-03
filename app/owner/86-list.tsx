// Module 10 — 86-list & Daily Specials
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useEightySixList, useDailySpecials, useInsert, useUpdate } from "@/hooks/management";
import { useMenu } from "@/hooks/queries";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

export default function EightySixList() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: menu } = useMenu(restaurant?.id);
  const { data: list } = useEightySixList(restaurant?.id);
  const { data: specials } = useDailySpecials(restaurant?.id);
  const insert86 = useInsert<Record<string, unknown>>("eighty_six_list", ["86-list"]);
  const update86 = useUpdate<Record<string, unknown>>("eighty_six_list", ["86-list"]);
  const insertSp = useInsert<Record<string, unknown>>("daily_specials", ["daily-specials"]);
  const toast = useToast();

  const [showSearch, setShowSearch] = useState(false);
  const [showSp, setShowSp] = useState(false);
  const [reason, setReason] = useState("Out of stock");
  const [spName, setSpName] = useState("");
  const [spDesc, setSpDesc] = useState("");
  const [spPrice, setSpPrice] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const eightySixIds = new Set((list ?? []).map((l) => l.menu_item_id));

  const mark86 = async (menuItemId: string) => {
    if (!restaurant?.id) return;
    try {
      await insert86.mutateAsync({
        restaurant_id: restaurant.id,
        menu_item_id: menuItemId,
        business_date: today,
        reason,
        marked_by: me?.id ?? null,
      });
      toast.success("Marked 86");
    } catch (e) {
      toast.error("Already marked", (e as Error).message);
    }
  };

  const clear86 = async (id: string) => {
    await update86.mutateAsync({ id, patch: { cleared_at: new Date().toISOString() } });
    toast.success("Cleared");
  };

  const addSpecial = async () => {
    if (!restaurant?.id || !spName.trim()) return;
    await insertSp.mutateAsync({
      restaurant_id: restaurant.id,
      name: spName.trim(),
      description: spDesc.trim() || null,
      special_price: spPrice ? Number(spPrice) : null,
      business_date: today,
      created_by: me?.id ?? null,
    });
    setShowSp(false); setSpName(""); setSpDesc(""); setSpPrice("");
    toast.success("Special published");
  };

  return (
    <PageScroll>
      <PageHeader title="86-list & specials" subtitle="Mark out-of-stock items, publish daily specials." />

      {(() => {
        const list86 = list ?? [];
        const sp = specials ?? [];
        const totalMenu = (menu?.items ?? []).length;
        const availableMenu = totalMenu - list86.length;
        const avgSpecialPrice = sp.length === 0 ? 0 : sp.filter((s) => s.special_price).reduce((sum, s) => sum + Number(s.special_price ?? 0), 0) / Math.max(1, sp.filter((s) => s.special_price).length);
        return (
          <StatRow>
            <StatTile icon="xmark.circle" iconColor="#D43A2F" iconBg="#FCEAE6" label="86'd today" value={String(list86.length)} hint="Items unavailable" />
            <StatTile icon="checkmark.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Available" value={String(availableMenu)} hint={`Of ${totalMenu} menu items`} />
            <StatTile icon="sparkles" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Specials today" value={String(sp.length)} hint="Published to customers" />
            <StatTile icon="indianrupeesign.circle.fill" iconColor="#D97706" iconBg="#FFF7E0" label="Avg special price" value={avgSpecialPrice ? `₹${avgSpecialPrice.toFixed(0)}` : "—"} hint="Today's specials" />
          </StatRow>
        );
      })()}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => setShowSearch(true)} style={{ height: 30, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: OWNER_HAIRLINE, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="xmark.circle" size={11} color={OWNER_INK} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: OWNER_INK }}>Mark item 86</Text>
        </Pressable>
        <Pressable onPress={() => setShowSp(true)} style={{ height: 30, paddingHorizontal: 10, borderRadius: 6, backgroundColor: OWNER_INK, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="plus" size={11} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>New special</Text>
        </Pressable>
      </View>

      <CardShell>
        <CardHeader title="86-list (out today)" subtitle={`${(list ?? []).length} items`} />
        {(list ?? []).length === 0 ? (
          <EmptyState
            icon="checkmark.circle.fill"
            iconColor="#0F8A4F"
            iconBg="#E6F4ED"
            title="Everything's in stock"
            body="Mark items 86 when they run out so servers don't promise dishes that aren't available. The list resets every day at midnight."
            actionLabel="Mark item 86"
            onAction={() => setShowSearch(true)}
            compact
          />
        ) : null}
        {(list ?? []).map((l, i) => (
          <View key={l.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color="#D43A2F" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{l.menu_item?.name ?? "—"}</Text>
              <MonoText size={11} color={OWNER_MUTED}>{l.reason ?? "—"}</MonoText>
            </View>
            <Pressable onPress={() => clear86(l.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: OWNER_HAIRLINE }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_INK }}>Bring back</Text>
            </Pressable>
          </View>
        ))}
      </CardShell>

      <CardShell>
        <CardHeader title="Today's specials" subtitle={`${(specials ?? []).length} published`} />
        {(specials ?? []).length === 0 ? (
          <EmptyState
            icon="sparkles"
            title="Publish a daily special"
            body="Highlight a chef's pick, weekend brunch, or limited-stock item. Specials surface to customers on the home screen and detail page."
            actionLabel="New special"
            onAction={() => setShowSp(true)}
            compact
          />
        ) : null}
        {(specials ?? []).map((s, i) => (
          <View key={s.id} style={{ paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{s.name}</Text>
                {s.description ? <Text style={{ fontSize: 12, color: OWNER_MUTED, marginTop: 1 }}>{s.description}</Text> : null}
              </View>
              {s.special_price ? <MonoText size={14} weight="700" color={OWNER_ACCENT}>₹{s.special_price}</MonoText> : null}
            </View>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showSearch} onClose={() => setShowSearch(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Mark item out of stock</Text>
          <Input label="Reason" value={reason} onChangeText={setReason} />
          <View style={{ marginTop: 12, maxHeight: 360 }}>
            {(menu?.items ?? []).map((it) => {
              const eighty = eightySixIds.has(it.id);
              return (
                <Pressable
                  key={it.id}
                  onPress={() => !eighty && mark86(it.id)}
                  disabled={eighty}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10, opacity: eighty ? 0.4 : 1, borderBottomWidth: 1, borderBottomColor: OWNER_HAIRLINE }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{it.name}</Text>
                    <MonoText size={11} color={OWNER_MUTED}>₹{it.price}</MonoText>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: eighty ? OWNER_MUTED : "#D43A2F" }}>
                    {eighty ? "ALREADY 86" : "MARK 86"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Sheet.Body>
      </Sheet>

      <Sheet visible={showSp} onClose={() => setShowSp(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>New daily special</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="Name" value={spName} onChangeText={setSpName} />
            <Input label="Description" value={spDesc} onChangeText={setSpDesc} multiline numberOfLines={2} />
            <Input label="Special price ₹" value={spPrice} onChangeText={setSpPrice} keyboardType="decimal-pad" />
            <Button label="Publish" onPress={addSpecial} loading={insertSp.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
