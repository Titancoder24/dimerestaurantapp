import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Badge, Button, Chip, Icon, Input, Screen, Sheet, haptic } from "@/components/ui";
import { useAdminRestaurants } from "@/hooks/admin";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { pickAndUpload, pickMultipleAndUpload } from "@/lib/upload";
import { surface } from "@/lib/visual";

type RestaurantRow = Tables<"restaurants"> & {
  cost_for_two?: number | null;
  distance_km?: number | null;
  pre_booking_discount_pct?: number | null;
  bank_offer_label?: string | null;
  cashback_pct?: number | null;
  gallery_urls?: string[] | null;
};

export default function AdminDineout() {
  const profile = useAuth((s) => s.profile);
  const isAdmin = profile?.role === "super_admin" || profile?.role === "owner" || profile?.role === "manager";
  const { data, refetch } = useAdminRestaurants();
  const qc = useQueryClient();
  const toast = useToast();

  const [selected, setSelected] = useState<RestaurantRow | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = (data ?? []) as RestaurantRow[];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((r) => r.name.toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q));
  }, [data, search]);

  if (!isAdmin) {
    return (
      <Screen>
        <View style={{ padding: 32, alignItems: "center" }}>
          <Icon name="lock.fill" size={28} color={surface.ink3} />
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "700", color: surface.ink }}>Admin only</Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: surface.ink3 }}>Sign in as an admin or restaurant owner.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} className="bg-neutral-50">
      <View
        className="bg-white px-6 pb-4 pt-5"
        style={{ borderBottomWidth: 1, borderBottomColor: surface.hairline }}
      >
        <Text className="text-[11px] font-bold uppercase text-dime-ink-3" style={{ letterSpacing: 1.2 }}>Dineout</Text>
        <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Restaurants — Dineout content</Text>
        <Text className="mt-0.5 text-[13px] text-dime-ink-3">Upload gallery, set cost, distance, and cashback %.</Text>
        <View className="mt-3">
          <Input
            placeholder="Search by name or city"
            value={search}
            onChangeText={setSearch}
            leading={<Icon name="magnifyingglass" size={14} color={surface.ink3} />}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 10 }}>
        {filtered.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => { haptic.light(); setSelected(r); }}
            style={{
              flexDirection: "row", gap: 14, alignItems: "center",
              backgroundColor: "#fff", padding: 14, borderRadius: 16,
              borderWidth: 1, borderColor: surface.hairline,
            }}
          >
            {r.cover_image_url ? (
              <Image source={{ uri: r.cover_image_url }} style={{ width: 56, height: 56, borderRadius: 12 }} />
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center" }}>
                <Icon name="building.2.fill" size={20} color={surface.ink4} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: surface.ink }}>{r.name}</Text>
              <Text style={{ marginTop: 2, fontSize: 12, color: surface.ink3 }}>
                {r.city} · ₹{r.cost_for_two ?? 1200} for two · {r.cashback_pct ?? 20}% cashback
              </Text>
              <View style={{ marginTop: 6, flexDirection: "row", gap: 6 }}>
                <Badge tone={r.gallery_urls && r.gallery_urls.length > 0 ? "green" : "gray"} label={`${r.gallery_urls?.length ?? 0} photos`} />
                {r.featured ? <Badge tone="orange" label="Featured" /> : null}
              </View>
            </View>
            <Icon name="chevron.right" size={14} color={surface.ink3} />
          </Pressable>
        ))}

        {filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: surface.ink3 }}>No restaurants found.</Text>
          </View>
        ) : null}
      </ScrollView>

      <DineoutEditSheet
        restaurant={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
          qc.invalidateQueries({ queryKey: ["dineout-restaurants"] });
          qc.invalidateQueries({ queryKey: ["restaurant", selected?.id] });
          refetch();
          toast.success("Saved", "Dineout settings updated.");
        }}
      />
    </Screen>
  );
}

function DineoutEditSheet({
  restaurant, onClose, onSaved,
}: {
  restaurant: RestaurantRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [costForTwo, setCostForTwo] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<string>("");
  const [preBooking, setPreBooking] = useState<string>("");
  const [cashbackPct, setCashbackPct] = useState<string>("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const init = (r: RestaurantRow) => {
    setCostForTwo(r.cost_for_two != null ? String(r.cost_for_two) : "1200");
    setDistanceKm(r.distance_km != null ? String(r.distance_km) : "");
    setPreBooking(r.pre_booking_discount_pct != null ? String(r.pre_booking_discount_pct) : "");
    setCashbackPct(r.cashback_pct != null ? String(r.cashback_pct) : "20");
    setGalleryUrls(r.gallery_urls ?? []);
  };

  if (restaurant && galleryUrls.length === 0 && !cashbackPct) init(restaurant);

  const handleAddPhoto = async () => {
    if (!restaurant) return;
    setUploading(true);
    try {
      const url = await pickAndUpload({
        bucket: "restaurant-media",
        prefix: `dineout-gallery/${restaurant.id}`,
        quality: 0.85,
      });
      if (url) setGalleryUrls((prev) => [...prev, url]);
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddMultiple = async () => {
    if (!restaurant) return;
    setUploading(true);
    try {
      const urls = await pickMultipleAndUpload({
        bucket: "restaurant-media",
        prefix: `dineout-gallery/${restaurant.id}`,
        max: 10,
      });
      if (urls.length > 0) setGalleryUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeUrl = (url: string) => setGalleryUrls((prev) => prev.filter((u) => u !== url));

  const save = async () => {
    if (!restaurant) return;
    setSaving(true);
    try {
      const update: Record<string, unknown> = {
        cost_for_two: costForTwo.trim() ? Math.round(Number(costForTwo)) : null,
        distance_km: distanceKm.trim() ? Number(distanceKm) : null,
        pre_booking_discount_pct: preBooking.trim() ? Math.round(Number(preBooking)) : null,
        bank_offer_label: null,
        cashback_pct: cashbackPct.trim() ? Math.round(Number(cashbackPct)) : null,
        gallery_urls: galleryUrls,
      };
      const { error } = await supabase.from("restaurants").update(update).eq("id", restaurant.id);
      if (error) throw error;
      haptic.success();
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message;
      // If columns don't exist yet, the migration hasn't been applied.
      if (msg.includes("column") && msg.includes("does not exist")) {
        toast.error(
          "Migration needed",
          "Run supabase/migrations/015_dineout_metadata.sql in your Supabase SQL editor first.",
        );
      } else {
        toast.error("Save failed", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={!!restaurant} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        {restaurant ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{restaurant.name}</Text>
            <Text className="mt-0.5 text-[12px] text-dime-ink-3">Edit Dineout content & gallery</Text>

            <View className="mt-5 gap-3">
              <Text className="text-[11px] font-bold uppercase text-neutral-400" style={{ letterSpacing: 1.2 }}>Pricing & meta</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Cost for two (₹)" keyboardType="number-pad" value={costForTwo} onChangeText={setCostForTwo} placeholder="1200" />
                </View>
                <View className="flex-1">
                  <Input label="Distance (km)" keyboardType="decimal-pad" value={distanceKm} onChangeText={setDistanceKm} placeholder="5.1" />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Pre-booking discount %" keyboardType="number-pad" value={preBooking} onChangeText={setPreBooking} placeholder="30" />
                </View>
                <View className="flex-1">
                  <Input label="Cashback %" keyboardType="number-pad" value={cashbackPct} onChangeText={setCashbackPct} placeholder="20" />
                </View>
              </View>
            </View>

            <View className="mt-6 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-bold uppercase text-neutral-400" style={{ letterSpacing: 1.2 }}>
                  Gallery ({galleryUrls.length})
                </Text>
                <View className="flex-row gap-2">
                  <Chip label={uploading ? "Uploading…" : "+ Add photo"} onPress={handleAddPhoto} disabled={uploading} />
                  <Chip label="+ Many" onPress={handleAddMultiple} disabled={uploading} />
                </View>
              </View>
              {galleryUrls.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {galleryUrls.map((url) => (
                    <View key={url} style={{ position: "relative" }}>
                      <Image source={{ uri: url }} style={{ width: 96, height: 96, borderRadius: 12 }} />
                      <Pressable
                        onPress={() => removeUrl(url)}
                        style={{
                          position: "absolute", top: -6, right: -6,
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: "#E23744", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Icon name="xmark" size={11} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    borderWidth: 1, borderStyle: "dashed", borderColor: surface.hairlineStrong,
                    borderRadius: 14, padding: 24, alignItems: "center",
                  }}
                >
                  <Icon name="photo.fill" size={22} color={surface.ink3} />
                  <Text style={{ marginTop: 6, fontSize: 13, color: surface.ink3 }}>No photos yet — upload to enable the editorial gallery.</Text>
                </View>
              )}
            </View>

            <View className="mt-7 flex-row gap-3">
              <View className="flex-1">
                <Button label="Cancel" variant="secondary" onPress={onClose} fullWidth />
              </View>
              <View className="flex-1">
                <Button label="Save" loading={saving} onPress={save} fullWidth />
              </View>
            </View>
          </ScrollView>
        ) : null}
      </Sheet.Body>
    </Sheet>
  );
}
