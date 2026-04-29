import { useState } from "react";
import { Image, Pressable, Text, View, FlatList, ScrollView } from "react-native";
import { Badge, Chip, Button, Header, Icon, Input, Screen, Sheet, haptic } from "@/components/ui";
import { useAdminRestaurants } from "@/hooks/admin";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/format";

const statusFilters = ["all", "pending", "verified", "suspended", "banned"] as const;

export default function AdminRestaurants() {
  const qc = useQueryClient();
  const { data } = useAdminRestaurants();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]>("all");
  const [selected, setSelected] = useState<Tables<"restaurants"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);

  const filtered = (data ?? []).filter((r) => filter === "all" || r.status === filter);

  async function setStatus(id: string, status: "verified" | "suspended" | "banned", reason?: string) {
    setActing(true);
    try {
      const update: Record<string, unknown> = { status };
      if (status === "verified") update.featured = true;
      if (reason) update.rejection_reason = reason;
      await supabase.from("restaurants").update(update).eq("id", id);
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      haptic.success();
      setSelected(null);
      setShowReject(false);
      setRejectReason("");
    } finally { setActing(false); }
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from("restaurants").update({ featured: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
  }

  return (
    <Screen scroll={false}>
      <Header title="Restaurants" subtitle={`${filtered.length} of ${data?.length ?? 0}`} />
      <View className="px-5">
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => <Chip label={item} selected={filter === item} onPress={() => setFilter(item)} />}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        renderItem={({ item: r }) => (
          <Pressable
            onPress={() => setSelected(r)}
            className="flex-row gap-4 rounded-2xl bg-white p-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
          >
            {r.cover_image_url ? (
              <Image source={{ uri: r.cover_image_url }} className="h-16 w-16 rounded-lg" />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-lg bg-dime-bg-2">
                <Icon name="building.2.fill" size={20} color="#BFBFBF" />
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-[14px] font-bold text-dime-ink">{r.name}</Text>
                <Badge tone={r.status === "verified" ? "green" : r.status === "pending" ? "orange" : "red"} label={r.status} />
              </View>
              <Text className="text-[11px] text-dime-ink-3">{r.city} · {r.cuisines.join(", ")}</Text>
              <Text className="mt-0.5 text-[10px] text-dime-ink-4">Applied {timeAgo(r.created_at)}</Text>

              <View className="mt-2 flex-row gap-2">
                {r.status === "pending" ? (
                  <Pressable onPress={(e) => { e.stopPropagation(); setStatus(r.id, "verified"); }} className="flex-1 items-center rounded-lg bg-emerald-500 py-1.5">
                    <Text className="text-[12px] font-bold text-white">Approve</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={(e) => { e.stopPropagation(); toggleFeatured(r.id, r.featured); }} className={`flex-1 items-center rounded-lg py-1.5 ${r.featured ? "bg-dime-primary-500" : "bg-white"}`} style={r.featured ? undefined : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                  <Text className={`text-[12px] font-bold ${r.featured ? "text-white" : "text-dime-ink-2"}`}>{r.featured ? "Featured" : "Feature"}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />

      <Sheet visible={!!selected} onClose={() => { setSelected(null); setShowReject(false); }} maxHeight="92%">
        <Sheet.Body>
          {selected ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center gap-4">
                {selected.cover_image_url ? (
                  <Image source={{ uri: selected.cover_image_url }} className="h-20 w-20 rounded-2xl" />
                ) : (
                  <View className="h-20 w-20 items-center justify-center rounded-2xl bg-dime-bg-2">
                    <Icon name="building.2.fill" size={28} color="#BFBFBF" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{selected.name}</Text>
                  <Text className="text-[12px] text-dime-ink-3">{selected.city} · {selected.type}</Text>
                  <Badge tone={selected.status === "verified" ? "green" : selected.status === "pending" ? "orange" : "red"} label={selected.status} />
                </View>
              </View>

              <View className="mt-5 gap-3">
                <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Contact</Text>
                <DetailRow icon="phone.fill" label="Phone" value={selected.phone} />
                <DetailRow icon="envelope.fill" label="Email" value={selected.email} />
                <DetailRow icon="location.fill" label="Address" value={selected.address} />
              </View>

              <View className="mt-5 gap-3">
                <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Compliance & verification</Text>
                <DetailRow icon="doc.text.fill" label="FSSAI number" value={selected.fssai_number} required />
                {selected.fssai_certificate_url ? (
                  <View className="flex-row items-center gap-3 rounded-xl bg-emerald-50 p-3">
                    <Icon name="checkmark.circle.fill" size={16} color="#22C55E" />
                    <Text className="flex-1 text-[13px] font-bold text-emerald-700">FSSAI certificate uploaded</Text>
                    <Pressable onPress={() => { /* Could open in browser */ }}>
                      <Text className="text-[12px] font-bold text-emerald-600">View</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-3 rounded-xl bg-amber-50 p-3">
                    <Icon name="exclamationmark.triangle.fill" size={16} color="#F59E0B" />
                    <Text className="text-[13px] font-bold text-amber-700">No FSSAI certificate uploaded</Text>
                  </View>
                )}
                <DetailRow icon="doc.fill" label="GST number" value={selected.gst_number} />
                <DetailRow icon="creditcard.fill" label="PAN number" value={selected.pan_number} required />
              </View>

              <View className="mt-5 gap-3">
                <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Bank details</Text>
                <DetailRow icon="banknote.fill" label="Account name" value={selected.bank_account_name} />
                <DetailRow icon="number" label="Account number" value={selected.bank_account_number} />
                <DetailRow icon="building.columns.fill" label="IFSC" value={selected.bank_ifsc} />
              </View>

              <View className="mt-5 gap-3">
                <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Business info</Text>
                <DetailRow icon="fork.knife" label="Cuisines" value={selected.cuisines.join(", ")} />
                <DetailRow icon="sparkles" label="Amenities" value={selected.amenities.join(", ")} />
                <DetailRow icon="percent" label="Tax rate" value={`${selected.tax_rate}%`} />
                <DetailRow icon="percent" label="Service charge" value={`${selected.service_charge_rate}%`} />
              </View>

              {selected.gallery_images.length > 0 ? (
                <View className="mt-5">
                  <Text className="mb-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Gallery</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {selected.gallery_images.map((url, i) => (
                      <Image key={i} source={{ uri: url }} className="h-24 w-24 rounded-lg" />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {showReject ? (
                <View className="mt-5 gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <Text className="text-[14px] font-bold text-red-900">Reject application</Text>
                  <Input
                    label="Reason (sent to owner)"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. FSSAI certificate missing, invalid PAN..."
                  />
                  <View className="flex-row gap-3">
                    <Button label="Cancel" variant="secondary" onPress={() => setShowReject(false)} />
                    <View className="flex-1">
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

              <View className="mt-5 gap-3">
                {selected.status === "pending" ? (
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Button label="Approve & go live" loading={acting} onPress={() => setStatus(selected.id, "verified")} fullWidth />
                    </View>
                    <View className="flex-1">
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
              </View>
            </ScrollView>
          ) : null}
        </Sheet.Body>
      </Sheet>
    </Screen>
  );
}

function DetailRow({ icon, label, value, required }: { icon: string; label: string; value: string | null | undefined; required?: boolean }) {
  const missing = !value;
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-white p-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
      <Icon name={icon} size={14} color={missing && required ? "#F59E0B" : "#8A8A8A"} />
      <View className="flex-1">
        <Text className="text-[11px] text-dime-ink-3">{label}{required ? " *" : ""}</Text>
        <Text className={`text-[13px] font-bold ${missing ? "text-dime-ink-4 italic" : "text-dime-ink"}`}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );
}
