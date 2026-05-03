// Module 5 — Vendors & Purchase Orders
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useVendors, usePurchaseOrders, useInsert } from "@/hooks/management";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const PO_DOT: Record<string, string> = {
  draft: "#A1A09A", sent: "#3358D4", partial: "#D97706", received: "#0F8A4F", paid: "#0F8A4F", cancelled: "#D43A2F",
};

export default function Vendors() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: vendors } = useVendors(restaurant?.id);
  const { data: pos } = usePurchaseOrders(restaurant?.id);
  const insertV = useInsert<Record<string, unknown>>("vendors", ["vendors"]);
  const insertPO = useInsert<Record<string, unknown>>("purchase_orders", ["pos"]);
  const toast = useToast();

  const [showVendor, setShowVendor] = useState(false);
  const [vName, setVName] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vTerms, setVTerms] = useState("NET-7");
  const [vCat, setVCat] = useState("Produce");

  const [showPO, setShowPO] = useState(false);
  const [poVendor, setPoVendor] = useState<string>("");
  const [poTotal, setPoTotal] = useState("");
  const [poNotes, setPoNotes] = useState("");

  const createVendor = async () => {
    if (!restaurant?.id || !vName.trim()) return;
    await insertV.mutateAsync({
      restaurant_id: restaurant.id, name: vName.trim(),
      phone: vPhone.trim() || null, payment_terms: vTerms, category: vCat,
    });
    setShowVendor(false); setVName(""); setVPhone("");
    toast.success("Vendor added");
  };

  const createPO = async () => {
    if (!restaurant?.id || !poVendor) return;
    const total = Number(poTotal) || 0;
    await insertPO.mutateAsync({
      restaurant_id: restaurant.id,
      vendor_id: poVendor,
      po_number: `PO-${Date.now().toString(36).toUpperCase()}`,
      status: "draft",
      subtotal: total, tax: 0, total,
      notes: poNotes.trim() || null,
      created_by: me?.id ?? null,
    });
    setShowPO(false); setPoVendor(""); setPoTotal(""); setPoNotes("");
    toast.success("PO drafted");
  };

  return (
    <PageScroll>
      <PageHeader title="Vendors & POs" subtitle="Suppliers, payment terms, purchase orders." />

      {(() => {
        const v = vendors ?? [];
        const p = pos ?? [];
        const openPOs = p.filter((x) => x.status === "draft" || x.status === "sent" || x.status === "partial");
        const openValue = openPOs.reduce((s, x) => s + Number(x.total), 0);
        const monthValue = p.filter((x) => x.created_at?.startsWith(new Date().toISOString().slice(0, 7)) ?? false).reduce((s, x) => s + Number(x.total), 0);
        return (
          <StatRow>
            <StatTile icon="shippingbox.fill" label="Active vendors" value={String(v.filter((x) => x.is_active).length)} hint={`${v.length} total on file`} />
            <StatTile icon="doc.text.fill" iconColor="#3358D4" iconBg="#E6EDFA" label="Open POs" value={String(openPOs.length)} hint="Drafts + in flight" />
            <StatTile icon="indianrupeesign.circle.fill" iconColor="#D97706" iconBg="#FFF7E0" label="Open PO value" value={`₹${openValue.toLocaleString("en-IN")}`} hint="Committed spend" />
            <StatTile icon="calendar" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="This month" value={`₹${monthValue.toLocaleString("en-IN")}`} hint="POs raised in current month" />
          </StatRow>
        );
      })()}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => setShowVendor(true)} style={{ height: 30, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: OWNER_HAIRLINE, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="plus" size={11} color={OWNER_INK} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: OWNER_INK }}>Add vendor</Text>
        </Pressable>
        <Pressable onPress={() => setShowPO(true)} style={{ height: 30, paddingHorizontal: 10, borderRadius: 6, backgroundColor: OWNER_INK, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="plus" size={11} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Draft PO</Text>
        </Pressable>
      </View>

      <CardShell>
        <CardHeader title="Vendors" subtitle={`${(vendors ?? []).length} on file`} />
        {(vendors ?? []).length === 0 ? (
          <EmptyState
            icon="shippingbox.fill"
            title="Add your first supplier"
            body="Track payment terms, lead days, and contact info. POs reference vendors so you always know who you owe and when."
            actionLabel="Add vendor"
            onAction={() => setShowVendor(true)}
          />
        ) : null}
        {(vendors ?? []).map((v, i) => (
          <View key={v.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={v.is_active ? "#0F8A4F" : OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{v.name}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {v.category ?? "Misc"} · {v.payment_terms} · Lead {v.lead_days ?? 1}d
                {v.phone ? ` · ${v.phone}` : ""}
              </MonoText>
            </View>
          </View>
        ))}
      </CardShell>

      <CardShell>
        <CardHeader title="Purchase orders" subtitle={`${(pos ?? []).length} total`} />
        {(pos ?? []).length === 0 ? (
          <EmptyState
            icon="doc.text.fill"
            title="Draft your first PO"
            body="Send purchase orders to vendors with quantities, expected delivery, and tax. Mark them received as inventory comes in."
            actionLabel="Draft PO"
            onAction={() => setShowPO(true)}
            compact
          />
        ) : null}
        {(pos ?? []).map((p, i) => (
          <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={PO_DOT[p.status] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{p.po_number ?? p.id.slice(0, 8)}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {p.vendor?.name ?? "—"} · {p.status}{p.expected_delivery ? ` · ${p.expected_delivery}` : ""}
              </MonoText>
            </View>
            <MonoText size={13} weight="700">₹{Number(p.total).toLocaleString("en-IN")}</MonoText>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showVendor} onClose={() => setShowVendor(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Add vendor</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="Name" value={vName} onChangeText={setVName} />
            <Input label="Phone" value={vPhone} onChangeText={setVPhone} keyboardType="phone-pad" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Terms" value={vTerms} onChangeText={setVTerms} placeholder="NET-7" /></View>
              <View style={{ flex: 1 }}><Input label="Category" value={vCat} onChangeText={setVCat} /></View>
            </View>
            <Button label="Save" onPress={createVendor} loading={insertV.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>

      <Sheet visible={showPO} onClose={() => setShowPO(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Draft PO</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>VENDOR</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(vendors ?? []).map((v) => (
                <Pressable key={v.id} onPress={() => setPoVendor(v.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: poVendor === v.id ? OWNER_INK : "#fff", borderWidth: 1, borderColor: poVendor === v.id ? OWNER_INK : OWNER_HAIRLINE }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: poVendor === v.id ? "#fff" : OWNER_INK }}>{v.name}</Text>
                </Pressable>
              ))}
            </View>
            <Input label="Estimated total (₹)" value={poTotal} onChangeText={setPoTotal} keyboardType="decimal-pad" />
            <Input label="Notes" value={poNotes} onChangeText={setPoNotes} multiline numberOfLines={2} />
            <Button label="Save draft" onPress={createPO} loading={insertPO.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
