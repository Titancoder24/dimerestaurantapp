import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, Chip, ChipRow, Header, Icon, Input, Screen, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { pickAndUpload, pickMultipleAndUpload } from "@/lib/upload";

const cuisinePool = ["North Indian","South Indian","Mughlai","Chinese","Italian","Continental","Japanese","Sushi","Pizza","Pasta","Mexican","Thai","Vegan","Healthy","Bakery","Coffee","Bar"];
const amenityPool = ["Wifi","Parking","AC","Valet","Outdoor Seating","Pet Friendly","Live Music","Chef Counter","Wine Bar","Rooftop","Smoking Area","Wheelchair Accessible"];
const restaurantTypes: { k: "fine_dine"|"qsr"|"cafe"|"bar"|"bakery"|"cloud_kitchen"|"food_court"; l: string }[] = [
  { k: "fine_dine", l: "Fine Dining" },
  { k: "qsr", l: "Quick Service" },
  { k: "cafe", l: "Café" },
  { k: "bar", l: "Bar / Pub" },
  { k: "bakery", l: "Bakery" },
  { k: "cloud_kitchen", l: "Cloud Kitchen" },
  { k: "food_court", l: "Food Court" },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const dayKeys = ["mon","tue","wed","thu","fri","sat","sun"] as const;

type Hours = Record<string, { open: string; close: string; closed: boolean }>;

const defaultHours: Hours = dayKeys.reduce((acc, k) => {
  acc[k] = { open: "12:00", close: "23:00", closed: false };
  return acc;
}, {} as Hours);

export default function OwnerOnboarding() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const toast = useToast();

  if (!profile) return <Redirect href="/login" />;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<typeof restaurantTypes[number]["k"]>("cafe");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState(2);

  const [phone, setPhone] = useState(profile.phone ?? "");
  const [email, setEmail] = useState(profile.email);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bengaluru");

  const [fssai, setFssai] = useState("");
  const [gst, setGst] = useState("");
  const [taxRate, setTaxRate] = useState("5");
  const [serviceCharge, setServiceCharge] = useState("0");

  const [hours, setHours] = useState<Hours>(defaultHours);
  const [amenities, setAmenities] = useState<string[]>(["Wifi", "AC"]);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const totalSteps = 7;
  const progress = ((step + 1) / totalSteps) * 100;

  function next() {
    if (step === 0 && (!name.trim() || cuisines.length === 0)) return toast.error("Add a name and at least one cuisine");
    if (step === 1 && (!phone.trim() || !email.includes("@"))) return toast.error("Enter contact details");
    if (step === 2 && !address.trim()) return toast.error("Enter your address");
    haptic.light();
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  }
  function prev() {
    haptic.light();
    setStep((s) => Math.max(0, s - 1));
  }

  function toggleCuisine(c: string) {
    setCuisines(cuisines.includes(c) ? cuisines.filter((x) => x !== c) : [...cuisines, c]);
  }
  function toggleAmenity(a: string) {
    setAmenities(amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a]);
  }
  function setHour(k: string, field: "open" | "close" | "closed", value: string | boolean) {
    setHours({ ...hours, [k]: { ...hours[k]!, [field]: value } });
  }

  async function uploadCover() {
    setUploading(true);
    try {
      const url = await pickAndUpload({ bucket: "restaurant-media", prefix: profile.id, aspect: [16, 9] });
      if (url) setCoverUrl(url);
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally { setUploading(false); }
  }
  async function uploadGallery() {
    setUploading(true);
    try {
      const urls = await pickMultipleAndUpload({ bucket: "restaurant-media", prefix: profile.id, max: 5 });
      if (urls.length) setGallery([...gallery, ...urls].slice(0, 8));
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally { setUploading(false); }
  }

  async function submit() {
    setSaving(true);
    try {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      const dbHours: Record<string, { open: string; close: string }> = {};
      for (const k of dayKeys) {
        if (!hours[k]!.closed) dbHours[k] = { open: hours[k]!.open, close: hours[k]!.close };
      }
      const { data, error } = await supabase
        .from("restaurants")
        .insert({
          owner_id: profile.id,
          name,
          slug,
          description,
          type,
          cuisines,
          price_range: priceRange,
          address,
          city,
          phone,
          email,
          hours: dbHours,
          amenities,
          fssai_number: fssai || null,
          gst_number: gst || null,
          tax_rate: Number(taxRate) || 5,
          service_charge_rate: Number(serviceCharge) || 0,
          cover_image_url: coverUrl,
          gallery_images: gallery,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      // Auto-create owner staff record so the owner can show up in floor manager / take orders.
      await supabase.from("staff").insert({
        restaurant_id: data.id,
        user_id: profile.id,
        name: profile.name ?? "Owner",
        phone: profile.phone,
        role: "owner",
        pin: "1234",
        permissions: {
          view_all_data: true, edit_restaurant_profile: true, manage_staff: true, edit_menu: true,
          toggle_menu_availability: true, view_revenue: true, view_inventory: true, log_expenses: true,
          manage_offers: true, access_floor_manager: true, assign_tables: true, manage_reservations: true,
          take_orders: true, view_kitchen_display: true, mark_orders_prepared: true, generate_bill: true,
          apply_discount_low: true, apply_discount_high: true, void_order: true, close_bill: true, reply_to_reviews: true,
        },
        is_active: true,
      });

      haptic.success();
      toast.success("Restaurant submitted!", "We'll review and approve shortly.");
      router.replace("/owner/dashboard");
    } catch (e) {
      haptic.error();
      toast.error("Could not submit", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll={false}>
      <Header title="Get your restaurant on DIME" subtitle={`Step ${step + 1} of ${totalSteps}`} />

      <View className="px-4">
        <View className="h-1.5 overflow-hidden rounded-full bg-dime-bg-2">
          <View className="h-full rounded-full bg-dime-orange-500" style={{ width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <View className="gap-4">
            <SectionTitle icon="building.2.fill" title="Tell us about your restaurant" />
            <Input label="Restaurant name" value={name} onChangeText={setName} placeholder="The Little Spice Kitchen" />
            <View>
              <Text className="mb-2 text-[13px] font-medium text-dime-ink-2">Type</Text>
              <ChipRow>
                {restaurantTypes.map((t) => (
                  <Chip key={t.k} label={t.l} selected={type === t.k} onPress={() => setType(t.k)} />
                ))}
              </ChipRow>
            </View>
            <View>
              <Text className="mb-2 text-[13px] font-medium text-dime-ink-2">Cuisines (pick all that apply)</Text>
              <ChipRow>
                {cuisinePool.map((c) => (
                  <Chip key={c} label={c} selected={cuisines.includes(c)} onPress={() => toggleCuisine(c)} />
                ))}
              </ChipRow>
            </View>
            <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="One short paragraph about your food and vibe." />
            <View>
              <Text className="mb-2 text-[13px] font-medium text-dime-ink-2">Price range</Text>
              <ChipRow>
                {[1, 2, 3, 4].map((p) => (
                  <Chip key={p} label={"₹".repeat(p)} selected={priceRange === p} onPress={() => setPriceRange(p)} />
                ))}
              </ChipRow>
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="gap-4">
            <SectionTitle icon="phone.fill" title="Contact info" />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 80 1234 5678" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-4">
            <SectionTitle icon="location.fill" title="Where are you located?" />
            <Input label="Address" value={address} onChangeText={setAddress} multiline numberOfLines={3} placeholder="80 Feet Road, 5th Block, Koramangala" />
            <Input label="City" value={city} onChangeText={setCity} />
          </View>
        ) : null}

        {step === 3 ? (
          <View className="gap-4">
            <SectionTitle icon="doc.text.fill" title="Legal & tax" />
            <Text className="text-[12px] text-dime-ink-3">FSSAI and GST numbers help us verify your business. You can add or update these later.</Text>
            <Input label="FSSAI license number" value={fssai} onChangeText={setFssai} placeholder="14-digit number" />
            <Input label="GST number" value={gst} onChangeText={setGst} placeholder="Optional" />
            <View className="flex-row gap-3">
              <View className="flex-1"><Input label="Tax %" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" /></View>
              <View className="flex-1"><Input label="Service charge %" value={serviceCharge} onChangeText={setServiceCharge} keyboardType="decimal-pad" /></View>
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View className="gap-3">
            <SectionTitle icon="clock.fill" title="Operating hours" />
            {dayKeys.map((k, i) => (
              <View key={k} className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3">
                <View className="w-10">
                  <Text className="text-[13px] font-semibold text-dime-ink">{days[i]}</Text>
                </View>
                <Pressable
                  onPress={() => setHour(k, "closed", !hours[k]!.closed)}
                  className={`rounded-full px-3 py-1 ${hours[k]!.closed ? "bg-gray-200" : "bg-emerald-100"}`}
                >
                  <Text className={`text-[11px] font-semibold ${hours[k]!.closed ? "text-gray-600" : "text-emerald-700"}`}>
                    {hours[k]!.closed ? "Closed" : "Open"}
                  </Text>
                </Pressable>
                {!hours[k]!.closed ? (
                  <View className="flex-1 flex-row items-center gap-2">
                    <Input
                      containerClassName="flex-1"
                      value={hours[k]!.open}
                      onChangeText={(t) => setHour(k, "open", t)}
                      placeholder="12:00"
                    />
                    <Text className="text-[12px] text-dime-ink-3">to</Text>
                    <Input
                      containerClassName="flex-1"
                      value={hours[k]!.close}
                      onChangeText={(t) => setHour(k, "close", t)}
                      placeholder="23:00"
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {step === 5 ? (
          <View className="gap-4">
            <SectionTitle icon="sparkles" title="Amenities" />
            <Text className="text-[12px] text-dime-ink-3">Help diners know what to expect.</Text>
            <ChipRow>
              {amenityPool.map((a) => (
                <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => toggleAmenity(a)} />
              ))}
            </ChipRow>
          </View>
        ) : null}

        {step === 6 ? (
          <View className="gap-4">
            <SectionTitle icon="photo.fill" title="Photos" />
            <Text className="text-[12px] text-dime-ink-3">A great cover photo and 3+ gallery photos make your listing stand out.</Text>

            <View>
              <Text className="mb-2 text-[13px] font-medium text-dime-ink-2">Cover photo</Text>
              <Pressable
                onPress={uploadCover}
                disabled={uploading}
                className="aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-dime-orange-300 bg-dime-orange-50"
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} className="h-full w-full" />
                ) : (
                  <View className="items-center">
                    <Icon name="photo.fill" size={28} color="#FC8019" />
                    <Text className="mt-2 text-[13px] font-semibold text-dime-orange-700">Tap to upload</Text>
                    <Text className="text-[11px] text-dime-ink-3">16:9 looks best</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] font-medium text-dime-ink-2">Gallery ({gallery.length}/8)</Text>
                <Pressable onPress={uploadGallery} disabled={uploading}>
                  <Text className="text-[12px] font-semibold text-dime-orange-600">+ Add photos</Text>
                </Pressable>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {gallery.map((url, i) => (
                  <View key={i} className="relative">
                    <Image source={{ uri: url }} className="h-20 w-20 rounded-lg" />
                    <Pressable
                      onPress={() => setGallery(gallery.filter((u) => u !== url))}
                      className="absolute -right-1.5 -top-1.5 h-5 w-5 items-center justify-center rounded-full bg-dime-danger"
                    >
                      <Icon name="xmark" size={10} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {gallery.length === 0 ? (
                  <Text className="text-[12px] text-dime-ink-3">No gallery photos yet — diners love seeing the food and ambience.</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-dime-border bg-white px-4 py-3">
        {step > 0 ? (
          <Button label="Back" variant="secondary" onPress={prev} />
        ) : (
          <View />
        )}
        <View className="flex-1">
          {step < totalSteps - 1 ? (
            <Button label="Continue" onPress={next} fullWidth />
          ) : (
            <Button label="Submit for review" loading={saving} onPress={submit} fullWidth />
          )}
        </View>
      </View>
    </Screen>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-dime-orange-50">
        <Icon name={icon} size={16} color="#FC8019" />
      </View>
      <Text className="text-[18px] font-semibold text-dime-ink">{title}</Text>
    </View>
  );
}
