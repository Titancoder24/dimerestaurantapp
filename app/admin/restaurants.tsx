import { useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View, ScrollView } from "react-native";
import { Button, Icon, Input, Sheet, haptic } from "@/components/ui";
import { useAdminRestaurants } from "@/hooks/admin";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  StatRow, StatTile, Pill, StatusDot,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type StatusFilter = "all" | "pending" | "verified" | "suspended" | "banned";
const filters: StatusFilter[] = ["all", "pending", "verified", "suspended", "banned"];

const statusTone: Record<string, "neutral" | "saffron" | "lilac" | "green" | "red" | "amber"> = {
  pending: "amber", verified: "green", suspended: "red", banned: "red",
};

export default function AdminRestaurants() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useAdminRestaurants();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tables<"restaurants"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);

  const list = data ?? [];
  const verified = list.filter((r) => r.status === "verified").length;
  const pending = list.filter((r) => r.status === "pending").length;
  const suspended = list.filter((r) => r.status === "suspended").length;
  const featuredCount = list.filter((r) => r.featured).length;

  const filtered = useMemo(() => {
    let arr = list;
    if (filter !== "all") arr = arr.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q))
      );
    }
    return arr.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [list, filter, search]);

  async function setStatus(id: string, status: "verified" | "suspended" | "banned", reason?: string) {
    setActing(true);
    try {
      const update: Record<string, unknown> = { status };
      if (status === "verified") update.featured = true;
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("restaurants").update(update).eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      qc.invalidateQueries({ queryKey: ["platform-stats"] });
      haptic.success();
      toast.success(status === "verified" ? "Approved & live" : status === "suspended" ? "Suspended" : "Banned");
      setSelected(null);
      setShowReject(false);
      setRejectReason("");
    } catch (e) {
      toast.error("Action failed", (e as Error).message);
    } finally { setActing(false); }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await supabase.from("restaurants").update({ featured: !current }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      toast.success(!current ? "Now featured" : "Removed from featured");
    } catch (e) {
      toast.error("Could not update", (e as Error).message);
    }
  }

  return (
    <PageScroll>
      <PageHeader
        title="Restaurants"
        subtitle={`${list.length} tenants on the platform · ${pending} awaiting review`}
        rightSlot={
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              height: 34, paddingHorizontal: 10, borderRadius: 8,
              backgroundColor: ADMIN_PANEL, borderWidth: 1, borderColor: ADMIN_HAIRLINE,
              minWidth: 240,
            }}
          >
            <Icon name="magnifyingglass" size={12} color={ADMIN_INK3} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, city or cuisine"
              placeholderTextColor={ADMIN_INK3}
              style={{ flex: 1, color: ADMIN_INK, fontSize: 12.5, padding: 0, outlineStyle: "none" } as any}
            />
          </View>
        }
      />

      <StatRow>
        <StatTile icon="building.2.fill" iconBg="#1B1730" iconColor={ADMIN_ACCENT2} label="Total" value={String(list.length)} hint="Across all states" />
        <StatTile icon="checkmark.seal.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Verified" value={String(verified)} hint={`${list.length > 0 ? Math.round((verified / list.length) * 100) : 0}% of platform`} />
        <StatTile icon="clock.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="Pending" value={String(pending)} hint="In review queue" />
        <StatTile icon="star.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Featured" value={String(featuredCount)} hint="On the discover hero" />
      </StatRow>

      {/* Filter chips */}
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const active = f === filter;
          const count = f === "all" ? list.length : list.filter((r) => r.status === f).length;
          return (
            <Pressable
              key={f}
              onPress={() => { haptic.light(); setFilter(f); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, textTransform: "capitalize", letterSpacing: -0.1 }}>
                {f}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? ADMIN_BG : ADMIN_INK3, fontFamily: ADMIN_MONO }}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Tenant directory" subtitle={`${filtered.length} match · approve, suspend or feature inline`} />
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon="building.2.fill"
            title={search ? "No restaurants matched" : "Nothing in this bucket"}
            body={search ? "Try a different search term or clear the filter." : "When restaurants apply, they'll show up here for review."}
            compact
          />
        ) : null}
        {filtered.map((r, i) => (
          <Pressable
            key={r.id}
            onPress={() => setSelected(r)}
            style={({ hovered }: any) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              backgroundColor: hovered ? ADMIN_HOVER : "transparent",
            })}
          >
            {r.cover_image_url ? (
              <Image source={{ uri: r.cover_image_url }} style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: ADMIN_PANEL2 }} />
            ) : (
              <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2, alignItems: "center", justifyContent: "center" }}>
                <Icon name="building.2.fill" size={18} color={ADMIN_INK3} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.2, flexShrink: 1 }}>{r.name}</Text>
                <Pill tone={statusTone[r.status] ?? "neutral"}>{r.status}</Pill>
                {r.featured ? <Pill tone="saffron" icon="star.fill">Featured</Pill> : null}
              </View>
              <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 12, color: ADMIN_INK2, letterSpacing: -0.05 }}>
                {r.city ?? "—"} · {r.cuisines.slice(0, 4).join(", ") || "No cuisines"}
              </Text>
              <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MonoText size={10.5} color={ADMIN_INK3}>APPLIED {timeAgo(r.created_at).toUpperCase()}</MonoText>
                {r.fssai_certificate_url ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <StatusDot color={ADMIN_GREEN} size={5} />
                    <MonoText size={10.5} color={ADMIN_INK3}>FSSAI ✓</MonoText>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <StatusDot color={ADMIN_AMBER} size={5} />
                    <MonoText size={10.5} color={ADMIN_INK3}>FSSAI MISSING</MonoText>
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {r.status === "pending" ? (
                <Pressable
                  onPress={(e) => { e.stopPropagation(); setStatus(r.id, "verified"); }}
                  style={{ height: 30, paddingHorizontal: 11, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: ADMIN_GREEN }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#04190E", letterSpacing: -0.1 }}>Approve</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={(e) => { e.stopPropagation(); toggleFeatured(r.id, r.featured); }}
                style={{
                  height: 30, paddingHorizontal: 11, borderRadius: 7, alignItems: "center", justifyContent: "center",
                  backgroundColor: r.featured ? ADMIN_ACCENT : ADMIN_PANEL2,
                  borderWidth: 1, borderColor: r.featured ? ADMIN_ACCENT : ADMIN_HAIRLINE2,
                }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: "700", color: r.featured ? "#1A0A04" : ADMIN_INK2, letterSpacing: -0.1 }}>
                  {r.featured ? "Featured" : "Feature"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </CardShell>

      <Sheet visible={!!selected} onClose={() => { setSelected(null); setShowReject(false); }} maxHeight="92%">
        <Sheet.Body>
          {selected ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {selected.cover_image_url ? (
                  <Image source={{ uri: selected.cover_image_url }} style={{ width: 76, height: 76, borderRadius: 14 }} />
                ) : (
                  <View style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: "#F5F5F4", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="building.2.fill" size={26} color="#A3A3A3" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#0E0E0C", letterSpacing: -0.5 }}>{selected.name}</Text>
                  <Text style={{ marginTop: 2, fontSize: 12, color: "#8B8780" }}>{selected.city ?? "—"} · {selected.type ?? "Restaurant"}</Text>
                  <View style={{ marginTop: 6, flexDirection: "row", gap: 6 }}>
                    <Pill tone={statusTone[selected.status] ?? "neutral"}>{selected.status}</Pill>
                    {selected.featured ? <Pill tone="saffron" icon="star.fill">Featured</Pill> : null}
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 20, gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A3A3A3", letterSpacing: 1.2 }}>CONTACT</Text>
                <DetailRow icon="phone.fill" label="Phone" value={selected.phone} />
                <DetailRow icon="envelope.fill" label="Email" value={selected.email} />
                <DetailRow icon="location.fill" label="Address" value={selected.address} />
              </View>

              <View style={{ marginTop: 18, gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A3A3A3", letterSpacing: 1.2 }}>COMPLIANCE & VERIFICATION</Text>
                <DetailRow icon="doc.text.fill" label="FSSAI number" value={selected.fssai_number} required />
                {selected.fssai_certificate_url ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#86EFAC" }}>
                    <Icon name="checkmark.circle.fill" size={16} color="#16A34A" />
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: "#15803D" }}>FSSAI certificate uploaded</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#16A34A" }}>View</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FCD34D" }}>
                    <Icon name="exclamationmark.triangle.fill" size={16} color="#D97706" />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400E" }}>No FSSAI certificate uploaded</Text>
                  </View>
                )}
                <DetailRow icon="doc.fill" label="GST number" value={selected.gst_number} />
                <DetailRow icon="creditcard.fill" label="PAN number" value={selected.pan_number} required />
              </View>

              <View style={{ marginTop: 18, gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A3A3A3", letterSpacing: 1.2 }}>BANK</Text>
                <DetailRow icon="banknote.fill" label="Account name" value={selected.bank_account_name} />
                <DetailRow icon="number" label="Account number" value={selected.bank_account_number} />
                <DetailRow icon="building.columns.fill" label="IFSC" value={selected.bank_ifsc} />
              </View>

              <View style={{ marginTop: 18, gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A3A3A3", letterSpacing: 1.2 }}>BUSINESS</Text>
                <DetailRow icon="fork.knife" label="Cuisines" value={selected.cuisines.join(", ")} />
                <DetailRow icon="sparkles" label="Amenities" value={selected.amenities.join(", ")} />
                <DetailRow icon="percent" label="Tax rate" value={`${selected.tax_rate}%`} />
                <DetailRow icon="percent" label="Service charge" value={`${selected.service_charge_rate}%`} />
              </View>

              {selected.gallery_images.length > 0 ? (
                <View style={{ marginTop: 18 }}>
                  <Text style={{ marginBottom: 10, fontSize: 11, fontWeight: "700", color: "#A3A3A3", letterSpacing: 1.2 }}>GALLERY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {selected.gallery_images.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {showReject ? (
                <View style={{ marginTop: 18, gap: 10, padding: 14, borderRadius: 14, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FCA5A5" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#991B1B" }}>Reject application</Text>
                  <Input
                    label="Reason (sent to owner)"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. FSSAI certificate missing, invalid PAN…"
                  />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Button label="Cancel" variant="secondary" onPress={() => setShowReject(false)} />
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Confirm rejection"
                        loading={acting}
                        onPress={() => setStatus(selected.id, "suspended", rejectReason || "Application not approved")}
                        fullWidth
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              <View style={{ marginTop: 18, gap: 10 }}>
                {selected.status === "pending" ? (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Button label="Approve & go live" loading={acting} onPress={() => setStatus(selected.id, "verified")} fullWidth />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label="Reject" variant="secondary" onPress={() => setShowReject(true)} fullWidth />
                    </View>
                  </View>
                ) : null}
                {selected.status === "verified" ? (
                  <Button label="Suspend restaurant" variant="secondary" onPress={() => setShowReject(true)} fullWidth />
                ) : null}
                {selected.status === "suspended" ? (
                  <Button label="Re-approve" loading={acting} onPress={() => setStatus(selected.id, "verified")} fullWidth />
                ) : null}
                <Button
                  label="Delete restaurant (irreversible)"
                  variant="destructive"
                  onPress={async () => {
                    if (typeof window !== "undefined" && !window.confirm(`Permanently delete ${selected.name}? This removes the menu, bookings, orders, and all linked data.`)) return;
                    try {
                      const { error } = await supabase.rpc("admin_delete_restaurant", { p_restaurant_id: selected.id });
                      if (error) throw error;
                      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
                      qc.invalidateQueries({ queryKey: ["platform-stats"] });
                      toast.success("Restaurant deleted");
                      setSelected(null);
                    } catch (e) {
                      toast.error("Could not delete", (e as Error).message);
                    }
                  }}
                  fullWidth
                />
              </View>
            </ScrollView>
          ) : null}
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}

function DetailRow({ icon, label, value, required }: { icon: string; label: string; value: string | null | undefined; required?: boolean }) {
  const missing = !value;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#ECECEC" }}>
      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ECECEC", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={13} color={missing && required ? "#D97706" : "#A3A3A3"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#8B8780" }}>{label}{required ? " *" : ""}</Text>
        <Text style={{ marginTop: 1, fontSize: 13, fontWeight: "600", color: missing ? "#A3A3A3" : "#0E0E0C" }}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );
}
