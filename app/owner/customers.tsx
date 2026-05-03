// Module 2 — Customer CRM
import { useState, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useCustomers, useInsert } from "@/hooks/management";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const tierColor: Record<string, string> = {
  standard: OWNER_MUTED, silver: "#A1A09A", gold: "#D9A21A", vip: OWNER_ACCENT,
};

export default function Customers() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: customers } = useCustomers(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("customer_profiles", ["crm-customers"]);
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers ?? [];
    return (customers ?? []).filter((c) =>
      c.full_name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const create = async () => {
    if (!restaurant?.id || !name.trim()) return;
    try {
      await insert.mutateAsync({
        restaurant_id: restaurant.id,
        full_name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        staff_notes: notes.trim() || null,
      });
      setShowAdd(false); setName(""); setPhone(""); setEmail(""); setNotes("");
      toast.success("Customer added");
    } catch (e) {
      toast.error("Could not add", (e as Error).message);
    }
  };

  return (
    <PageScroll>
      <PageHeader title="Customers" subtitle="Profiles, visits, dietary preferences, staff notes." rightAction="Add customer" actionIcon="plus" onAction={() => setShowAdd(true)} />

      {(() => {
        const all = customers ?? [];
        const goldCount = all.filter((c) => c.loyalty_tier === "gold" || c.loyalty_tier === "vip").length;
        const totalSpend = all.reduce((s, c) => s + Number(c.total_spend), 0);
        const repeatCount = all.filter((c) => c.visits > 1).length;
        return (
          <StatRow>
            <StatTile icon="person.3.fill" label="Total customers" value={String(all.length)} hint="In your CRM" />
            <StatTile icon="star.fill" iconColor="#D9A21A" iconBg="#FFF7E0" label="VIP / Gold" value={String(goldCount)} hint="High-value tier" />
            <StatTile icon="arrow.counterclockwise" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Repeat customers" value={String(repeatCount)} hint="More than 1 visit" />
            <StatTile icon="indianrupeesign.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Lifetime value" value={`₹${Math.round(totalSpend).toLocaleString("en-IN")}`} hint="Across all customers" />
          </StatRow>
        );
      })()}

      <Input placeholder="Search by name, phone, email…" value={search} onChangeText={setSearch} />

      <CardShell>
        <CardHeader title="Database" subtitle={`${filtered.length} of ${(customers ?? []).length}`} />
        {filtered.length === 0 ? (
          <EmptyState
            icon="person.fill"
            title="Build your customer database"
            body="Capture names, phones, dietary preferences and birthdays from walk-ins and bookings. Use this to send targeted offers and remember regulars."
            actionLabel="Add first customer"
            onAction={() => setShowAdd(true)}
          />
        ) : null}
        {filtered.map((c, i) => (
          <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#F5F5F4", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: OWNER_INK }}>
                {c.full_name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{c.full_name}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {c.phone ?? c.email ?? "—"} · {c.visits} visits · ₹{Math.round(c.total_spend).toLocaleString("en-IN")}
              </MonoText>
            </View>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: "#F5F5F4" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: tierColor[c.loyalty_tier] ?? OWNER_MUTED, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {c.loyalty_tier}
              </Text>
            </View>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Add customer</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="Full name" value={name} onChangeText={setName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Staff notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            <Button label="Add to CRM" onPress={create} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
