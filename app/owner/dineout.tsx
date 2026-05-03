import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Badge, Button, Chip, ChipRow, Icon, Input, Screen, haptic } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { useQueryClient } from "@tanstack/react-query";
import { pickAndUpload, pickMultipleAndUpload } from "@/lib/upload";
import { T } from "@/lib/visual";
import { display, mono, num, Img } from "@/components/dime/atoms";

type DineoutRow = Tables<"restaurants"> & {
  cost_for_two?: number | null;
  distance_km?: number | null;
  pre_booking_discount_pct?: number | null;
  bank_offer_label?: string | null;
  cashback_pct?: number | null;
  gallery_urls?: string[] | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const cuisinePool = [
  "South Indian", "North Indian", "Mughlai", "Italian", "Pizza", "Pasta", "Japanese", "Sushi",
  "Chinese", "Continental", "BBQ", "Kebabs", "Awadhi", "Bengali", "Healthy", "Salads",
  "Bowls", "Bakery", "Café", "Beverages", "Bar Food",
];

export default function OwnerDineout() {
  const { data: restaurant, refetch } = useOwnedRestaurant();
  const r = restaurant as DineoutRow | undefined;
  const qc = useQueryClient();
  const toast = useToast();

  const [costForTwo, setCostForTwo] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [preBooking, setPreBooking] = useState("");
  const [cashbackPct, setCashbackPct] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!r) return;
    setCostForTwo(r.cost_for_two != null ? String(r.cost_for_two) : "1200");
    setDistanceKm(r.distance_km != null ? String(r.distance_km) : "");
    setPreBooking(r.pre_booking_discount_pct != null ? String(r.pre_booking_discount_pct) : "");
    setCashbackPct(r.cashback_pct != null ? String(r.cashback_pct) : "20");
    setGalleryUrls(r.gallery_urls ?? []);
    setCuisines(r.cuisines ?? []);
    setCoverUrl(r.cover_image_url ?? null);
    setLatitude(r.latitude != null ? String(r.latitude) : "");
    setLongitude(r.longitude != null ? String(r.longitude) : "");
  }, [r?.id]);

  const previewOffer = useMemo(() => {
    if (preBooking) return `Flat ${preBooking}% off · pre-book`;
    if (cashbackPct) return `${cashbackPct}% cashback`;
    return "—";
  }, [preBooking, cashbackPct]);

  if (!r) {
    return (
      <Screen className="bg-[#F6F2EC]">
        <View style={{ padding: 32, alignItems: "center" }}>
          <Icon name="building.2.fill" size={28} color={T.muted} />
          <Text style={[display(18, "600", -0.3), { marginTop: 12 }]}>No restaurant linked</Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: T.muted }}>
            Make sure your account owns a verified restaurant.
          </Text>
        </View>
      </Screen>
    );
  }

  const replaceCover = async () => {
    setUploadingCover(true);
    try {
      const url = await pickAndUpload({
        bucket: "restaurant-media",
        prefix: `${r.id}/cover`,
        aspect: [16, 9],
        quality: 0.9,
      });
      if (!url) return;
      setCoverUrl(url);
      await supabase.from("restaurants").update({ cover_image_url: url }).eq("id", r.id);
      qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
      qc.invalidateQueries({ queryKey: ["restaurant", r.id] });
      qc.invalidateQueries({ queryKey: ["dineout-restaurants"] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      haptic.success();
      toast.success("Cover updated");
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const addOnePhoto = async () => {
    setUploading(true);
    try {
      const url = await pickAndUpload({
        bucket: "restaurant-media",
        prefix: `${r.id}/gallery`,
        quality: 0.85,
      });
      if (url) setGalleryUrls((prev) => [...prev, url]);
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const addManyPhotos = async () => {
    setUploading(true);
    try {
      const urls = await pickMultipleAndUpload({
        bucket: "restaurant-media",
        prefix: `${r.id}/gallery`,
        max: 10,
      });
      if (urls.length) setGalleryUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => setGalleryUrls((prev) => prev.filter((u) => u !== url));

  const toggleCuisine = (c: string) =>
    setCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const save = async () => {
    setSaving(true);
    try {
      const update: Record<string, unknown> = {
        cost_for_two: costForTwo.trim() ? Math.round(Number(costForTwo)) : null,
        distance_km: distanceKm.trim() ? Number(distanceKm) : null,
        pre_booking_discount_pct: preBooking.trim() ? Math.round(Number(preBooking)) : null,
        cashback_pct: cashbackPct.trim() ? Math.round(Number(cashbackPct)) : null,
        gallery_urls: galleryUrls,
        cuisines,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
      };
      const { error } = await supabase.from("restaurants").update(update).eq("id", r.id);
      if (error) throw error;
      haptic.success();
      toast.success("Saved", "Customers will see your update next time they open DIME.");
      qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
      qc.invalidateQueries({ queryKey: ["restaurant", r.id] });
      qc.invalidateQueries({ queryKey: ["dineout-restaurants"] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      refetch();
    } catch (e) {
      toast.error("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false} className="bg-[#F6F2EC]">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 14 }}>
          <Text style={mono(11, "700", 1.4)}>DINEOUT CONTENT</Text>
          <Text style={[display(28, "600", -0.6), { marginTop: 4 }]}>What customers see</Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: T.muted }}>
            These fields show up on the home screen, listings, and your detail page.
          </Text>
        </View>

        {/* Live preview card */}
        <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
          <Text style={[mono(11, "700", 1.4), { marginBottom: 10 }]}>LIVE PREVIEW</Text>
          <View
            style={{
              backgroundColor: T.card, borderRadius: 18, overflow: "hidden",
              borderWidth: 1, borderColor: T.hairline,
            }}
          >
            <View style={{ position: "relative" }}>
              <Img uri={coverUrl} kind="restaurant" h={170} w={"100%" as unknown as number} radius={0} hue={28} />
              <Pressable
                onPress={replaceCover}
                disabled={uploadingCover}
                style={{
                  position: "absolute", bottom: 12, right: 12,
                  backgroundColor: T.ink,
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="camera.fill" size={12} color={T.cream} />
                <Text style={{ fontSize: 11.5, fontWeight: "600", color: T.cream }}>
                  {uploadingCover ? "Uploading…" : "Replace cover"}
                </Text>
              </Pressable>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={display(20, "600", -0.4)} numberOfLines={1}>{r.name}</Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                {cuisines.length ? cuisines.slice(0, 3).join(" · ") : "Add cuisines below"}
              </Text>
              <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={num(12, "500")}>₹{(Number(costForTwo) || 0).toLocaleString("en-IN")} for two</Text>
                <Text style={{ color: T.hairline, fontSize: 9 }}>•</Text>
                {distanceKm ? <Text style={num(12, "500")}>{distanceKm} km</Text> : null}
              </View>
              <View
                style={{
                  marginTop: 10, paddingHorizontal: 10, paddingVertical: 8,
                  borderRadius: 10, backgroundColor: T.cream,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="tag.fill" size={13} color={T.saffron} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: T.ink }}>{previewOffer}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pricing & meta */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text style={[mono(11, "700", 1.4), { marginBottom: 12 }]}>PRICING & META</Text>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Cost for two (₹)"
                  keyboardType="number-pad"
                  value={costForTwo}
                  onChangeText={setCostForTwo}
                  placeholder="1200"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Distance (km)"
                  keyboardType="decimal-pad"
                  value={distanceKm}
                  onChangeText={setDistanceKm}
                  placeholder="5.1"
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Pre-book discount %"
                  keyboardType="number-pad"
                  value={preBooking}
                  onChangeText={setPreBooking}
                  placeholder="30"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Cashback %"
                  keyboardType="number-pad"
                  value={cashbackPct}
                  onChangeText={setCashbackPct}
                  placeholder="25"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Map location */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text style={[mono(11, "700", 1.4), { marginBottom: 10 }]}>MAP LOCATION</Text>
          <Text style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
            Coordinates power the in-app map and "Directions" button on the customer detail page. Get them from Google Maps → right-click your venue → copy lat,lng.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Latitude" keyboardType="decimal-pad" value={latitude} onChangeText={setLatitude} placeholder="12.9716" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Longitude" keyboardType="decimal-pad" value={longitude} onChangeText={setLongitude} placeholder="77.5946" />
            </View>
          </View>
          {latitude && longitude ? (
            <Text style={{ marginTop: 8, fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
              Preview: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)} ·{" "}
              <Text style={{ color: "#FF5A1F", fontWeight: "700" }}>maps.google.com/?q={latitude},{longitude}</Text>
            </Text>
          ) : null}
        </View>

        {/* Cuisines */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text style={[mono(11, "700", 1.4), { marginBottom: 10 }]}>CUISINES</Text>
          <Text style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
            Pick all that apply. The first three appear on the discover card.
          </Text>
          <ChipRow>
            {cuisinePool.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={cuisines.includes(c)}
                onPress={() => toggleCuisine(c)}
              />
            ))}
          </ChipRow>
        </View>

        {/* Gallery */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={mono(11, "700", 1.4)}>GALLERY ({galleryUrls.length})</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={addOnePhoto}
                disabled={uploading}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                  backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="plus" size={11} color={T.ink} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: T.ink }}>
                  {uploading ? "Uploading…" : "Add photo"}
                </Text>
              </Pressable>
              <Pressable
                onPress={addManyPhotos}
                disabled={uploading}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
                  backgroundColor: T.ink,
                  flexDirection: "row", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="photo.fill" size={11} color={T.cream} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: T.cream }}>Add many</Text>
              </Pressable>
            </View>
          </View>
          {galleryUrls.length === 0 ? (
            <View
              style={{
                borderRadius: 14, paddingVertical: 28,
                borderWidth: 1, borderColor: T.hairline, borderStyle: "dashed",
                alignItems: "center", backgroundColor: T.card,
              }}
            >
              <Icon name="photo.fill" size={22} color={T.muted} />
              <Text style={{ marginTop: 6, fontSize: 13, color: T.muted, fontWeight: "500" }}>
                No photos yet — upload to power the editorial gallery.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {galleryUrls.map((url) => (
                <View key={url} style={{ position: "relative" }}>
                  <Image source={{ uri: url }} style={{ width: 110, height: 110, borderRadius: 12 }} />
                  <Pressable
                    onPress={() => removePhoto(url)}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: T.ruby,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon name="xmark" size={11} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* What else owners can edit */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Text style={[mono(11, "700", 1.4), { marginBottom: 10 }]}>ALSO CONFIGURABLE</Text>
          <View
            style={{
              backgroundColor: T.card, borderRadius: 16, padding: 4,
              borderWidth: 1, borderColor: T.hairline,
            }}
          >
            {[
              { icon: "fork.knife", label: "Menu (categories, items, prices, photos)", route: "/owner/menu" as const },
              { icon: "gift.fill", label: "Offers & promo codes", route: "/owner/offers" as const },
              { icon: "calendar", label: "Hours & seating", route: "/owner/settings" as const },
              { icon: "info.circle", label: "Name, description, phone, address", route: "/owner/settings" as const },
              { icon: "star.fill", label: "Reviews & responses", route: "/owner/reviews" as const },
              { icon: "sparkles", label: "Promoted ads", route: "/owner/ads" as const },
            ].map((row, i) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  paddingHorizontal: 12, paddingVertical: 12,
                  borderTopWidth: i ? 1 : 0, borderTopColor: T.hairline,
                }}
              >
                <View
                  style={{
                    width: 30, height: 30, borderRadius: 10,
                    backgroundColor: T.cream,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name={row.icon} size={14} color={T.ink} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", color: T.ink }}>{row.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Save */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <Button label="Save changes" loading={saving} onPress={save} fullWidth />
          <Text style={{ marginTop: 8, textAlign: "center", fontSize: 11.5, color: T.muted }}>
            Status: <Badge tone={r.status === "verified" ? "green" : "orange"} label={r.status} />  ·{" "}
            <Text style={num(11, "500")}>updated by you</Text>
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
