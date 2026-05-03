// Module 16 — Equipment maintenance
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useEquipment } from "@/hooks/management_extras";
import { useInsert } from "@/hooks/management";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const STATUS_DOT: Record<string, string> = {
  operational: "#0F8A4F", needs_service: "#D97706", out_of_service: "#D43A2F", retired: OWNER_MUTED,
};

export default function Equipment() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: equipment } = useEquipment(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("equipment", ["equipment"]);
  const toast = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState("kitchen");
  const [serial, setSerial] = useState("");
  const [warranty, setWarranty] = useState("");
  const [next, setNext] = useState("");

  const list = equipment ?? [];
  const operational = list.filter((e) => e.status === "operational").length;
  const needsService = list.filter((e) => e.status === "needs_service").length;
  const overdue = list.filter((e) => e.next_service_due && new Date(e.next_service_due).getTime() < Date.now()).length;

  const create = async () => {
    if (!restaurant?.id || !name.trim()) return;
    try {
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        name: name.trim(), category: cat,
        serial_number: serial.trim() || null,
        warranty_until: warranty.trim() || null,
        next_service_due: next.trim() || null,
        status: "operational",
      });
      setShowAdd(false); setName(""); setSerial(""); setWarranty(""); setNext("");
      toast.success("Equipment added");
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Equipment maintenance" subtitle="Asset register, service schedule, warranty." rightAction="Add asset" actionIcon="plus" onAction={() => setShowAdd(true)} />

      <StatRow>
        <StatTile icon="checkmark.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Operational" value={String(operational)} hint={`${list.length} total assets`} />
        <StatTile icon="exclamationmark.triangle.fill" iconColor="#D97706" iconBg="#FFF7E0" label="Needs service" value={String(needsService)} hint="Schedule a technician" />
        <StatTile icon="clock.fill" iconColor="#D43A2F" iconBg="#FCEAE6" label="Service overdue" value={String(overdue)} hint="Past next-service date" />
        <StatTile icon="shippingbox.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Categories" value={String(new Set(list.map((e) => e.category ?? "—")).size)} hint="Distinct types" />
      </StatRow>

      <CardShell>
        <CardHeader title="Asset register" subtitle={`${list.length} on file`} />
        {list.length === 0 ? (
          <EmptyState icon="shippingbox.fill" title="Build your asset register" body="Track chillers, fryers, ACs, dishwashers and ovens. Set next-service dates and warranty expiry — get alerted before something breaks during service." actionLabel="Add first asset" onAction={() => setShowAdd(true)} />
        ) : null}
        {list.map((e, i) => (
          <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={STATUS_DOT[e.status] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{e.name}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {(e.category ?? "—").toUpperCase()}
                {e.serial_number ? ` · ${e.serial_number}` : ""}
                {e.next_service_due ? ` · service by ${e.next_service_due}` : ""}
              </MonoText>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: STATUS_DOT[e.status] ?? OWNER_INK2, textTransform: "uppercase", letterSpacing: 0.4 }}>
              {e.status.replace("_", " ")}
            </Text>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Add asset</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Walk-in chiller #2" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Category" value={cat} onChangeText={setCat} placeholder="kitchen / front / utility" /></View>
              <View style={{ flex: 1 }}><Input label="Serial #" value={serial} onChangeText={setSerial} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Warranty until" value={warranty} onChangeText={setWarranty} placeholder="2026-12-31" /></View>
              <View style={{ flex: 1 }}><Input label="Next service" value={next} onChangeText={setNext} placeholder="2026-08-15" /></View>
            </View>
            <Button label="Save asset" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
