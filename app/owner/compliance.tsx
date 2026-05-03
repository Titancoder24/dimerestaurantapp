// Module 15 — Compliance calendar (FSSAI, GST, fire NOC, etc.)
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useCompliance } from "@/hooks/management_extras";
import { useInsert } from "@/hooks/management";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const KINDS = ["fssai", "gst", "fire_noc", "health_dept", "trade_license", "music_license", "other"];

function statusForExpiry(expires_at: string | null): { color: string; label: string } {
  if (!expires_at) return { color: OWNER_MUTED, label: "no date" };
  const days = Math.floor((new Date(expires_at).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { color: "#D43A2F", label: "expired" };
  if (days <= 7) return { color: "#D43A2F", label: `${days}d left` };
  if (days <= 30) return { color: "#D97706", label: `${days}d left` };
  return { color: "#0F8A4F", label: `${days}d left` };
}

export default function Compliance() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: items } = useCompliance(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("compliance_items", ["compliance"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState("fssai");
  const [title, setTitle] = useState("");
  const [refNum, setRefNum] = useState("");
  const [expires, setExpires] = useState("");

  const list = items ?? [];
  const expired = list.filter((i) => i.expires_at && new Date(i.expires_at).getTime() < Date.now()).length;
  const due30 = list.filter((i) => {
    if (!i.expires_at) return false;
    const d = (new Date(i.expires_at).getTime() - Date.now()) / 86_400_000;
    return d >= 0 && d <= 30;
  }).length;

  const create = async () => {
    if (!restaurant?.id || !title.trim()) return;
    try {
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        kind, title: title.trim(),
        reference_number: refNum.trim() || null,
        expires_at: expires.trim() || null,
        status: "active",
      });
      setShowAdd(false); setTitle(""); setRefNum(""); setExpires("");
      toast.success("Item added");
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Compliance calendar" subtitle="FSSAI, GST, fire NOC and license renewals." rightAction="Add item" actionIcon="plus" onAction={() => setShowAdd(true)} />

      <StatRow>
        <StatTile icon="checkmark.seal.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Active" value={String(list.filter((i) => i.status === "active").length)} hint="Currently in compliance" />
        <StatTile icon="exclamationmark.triangle.fill" iconColor="#D43A2F" iconBg="#FCEAE6" label="Expired" value={String(expired)} hint="Action required now" />
        <StatTile icon="clock.fill" iconColor="#D97706" iconBg="#FFF7E0" label="Due in 30d" value={String(due30)} hint="Plan renewal" />
        <StatTile icon="doc.text.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="On file" value={String(list.length)} hint="Total documents tracked" />
      </StatRow>

      <CardShell>
        <CardHeader title="Documents & licenses" subtitle={`${list.length} tracked`} />
        {list.length === 0 ? (
          <EmptyState icon="checkmark.seal.fill" title="Track your licenses" body="Add FSSAI, GST, fire NOC, music license and trade license. Reminders fire 30 and 7 days before expiry — never get caught with a lapsed paper." actionLabel="Add first item" onAction={() => setShowAdd(true)} />
        ) : null}
        {list.map((i, idx) => {
          const s = statusForExpiry(i.expires_at);
          return (
            <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: idx ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
              <StatusDot color={s.color} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{i.title}</Text>
                <MonoText size={11} color={OWNER_MUTED}>
                  {i.kind.toUpperCase()}{i.reference_number ? ` · ${i.reference_number}` : ""}{i.expires_at ? ` · ${i.expires_at}` : ""}
                </MonoText>
              </View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: s.color, textTransform: "uppercase", letterSpacing: 0.4, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>{s.label}</Text>
            </View>
          );
        })}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Add compliance item</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>KIND</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {KINDS.map((k) => (
                <Pressable key={k} onPress={() => setKind(k)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: kind === k ? OWNER_INK : "#fff", borderWidth: 1, borderColor: kind === k ? OWNER_INK : OWNER_HAIRLINE }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: kind === k ? "#fff" : OWNER_INK }}>{k.replace("_", " ")}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. FSSAI Central License" />
            <Input label="Reference number" value={refNum} onChangeText={setRefNum} />
            <Input label="Expires (YYYY-MM-DD)" value={expires} onChangeText={setExpires} placeholder="2026-12-31" />
            <Button label="Save item" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
