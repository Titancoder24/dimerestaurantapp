import { useState, useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Button, Chip, ChipRow, Header, Icon, Input, Screen, haptic } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { useQueryClient } from "@tanstack/react-query";
import { pickAndUpload } from "@/lib/upload";

const amenityPool = ["Wifi","Parking","AC","Valet","Outdoor Seating","Pet Friendly","Live Music","Chef Counter","Wine Bar","Rooftop"];

export default function Settings() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [tax, setTax] = useState("5");
  const [svc, setSvc] = useState("0");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    setName(restaurant.name);
    setDescription(restaurant.description ?? "");
    setPhone(restaurant.phone ?? "");
    setEmail(restaurant.email ?? "");
    setAddress(restaurant.address ?? "");
    setTax(String(restaurant.tax_rate));
    setSvc(String(restaurant.service_charge_rate));
    setAmenities(restaurant.amenities);
  }, [restaurant?.id]);

  async function save() {
    if (!restaurant) return;
    setSaving(true);
    try {
      await supabase.from("restaurants").update({
        name, description, phone, email, address,
        tax_rate: Number(tax), service_charge_rate: Number(svc),
        amenities,
      }).eq("id", restaurant.id);
      qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
      toast.success("Saved");
    } catch (e) { toast.error("Could not save", (e as Error).message); }
    finally { setSaving(false); }
  }

  const toggleAmenity = (a: string) => setAmenities(amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a]);

  async function uploadAsset(field: "logo_url" | "cover_image_url", kind: "logo" | "cover") {
    if (!restaurant) return;
    setUploading(kind);
    try {
      const url = await pickAndUpload({
        bucket: "restaurant-media",
        prefix: `${restaurant.id}/${kind}`,
        aspect: kind === "cover" ? [16, 9] : undefined,
      });
      if (!url) return;
      await supabase.from("restaurants").update({ [field]: url }).eq("id", restaurant.id);
      qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
      haptic.success();
      toast.success(kind === "logo" ? "Logo updated" : "Cover updated");
    } catch (e) {
      haptic.error();
      toast.error("Upload failed", (e as Error).message);
    } finally { setUploading(null); }
  }

  async function clearAsset(field: "logo_url" | "cover_image_url") {
    if (!restaurant) return;
    await supabase.from("restaurants").update({ [field]: null }).eq("id", restaurant.id);
    qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
  }

  return (
    <Screen>
      <Header title="Restaurant settings" />

      <View className="mx-4 mb-3 rounded-2xl border border-dime-border bg-white p-3">
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">Brand assets</Text>
        <View className="flex-row gap-3">
          <AssetTile
            label="Logo"
            uri={restaurant?.logo_url ?? null}
            uploading={uploading === "logo"}
            onUpload={() => uploadAsset("logo_url", "logo")}
            onClear={() => clearAsset("logo_url")}
            ratio="square"
          />
          <AssetTile
            label="Cover photo"
            uri={restaurant?.cover_image_url ?? null}
            uploading={uploading === "cover"}
            onUpload={() => uploadAsset("cover_image_url", "cover")}
            onClear={() => clearAsset("cover_image_url")}
            ratio="wide"
          />
        </View>
      </View>

      <View className="px-4 gap-3">
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Address" value={address} onChangeText={setAddress} multiline numberOfLines={2} />
        <View className="flex-row gap-3">
          <View className="flex-1"><Input label="Tax %" value={tax} onChangeText={setTax} keyboardType="decimal-pad" /></View>
          <View className="flex-1"><Input label="Service charge %" value={svc} onChangeText={setSvc} keyboardType="decimal-pad" /></View>
        </View>

        <Text className="mt-2 text-[13px] font-semibold text-dime-ink-2">Amenities</Text>
        <ChipRow>
          {amenityPool.map((a) => (
            <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => toggleAmenity(a)} />
          ))}
        </ChipRow>
      </View>
      <View className="mx-4 mt-6">
        <Button label="Save changes" loading={saving} onPress={save} fullWidth />
      </View>
    </Screen>
  );
}

function AssetTile({
  label, uri, uploading, onUpload, onClear, ratio,
}: {
  label: string;
  uri: string | null;
  uploading: boolean;
  onUpload: () => void;
  onClear: () => void;
  ratio: "square" | "wide";
}) {
  const aspectClass = ratio === "wide" ? "aspect-[16/9]" : "aspect-square";
  return (
    <View className="flex-1">
      <Pressable
        onPress={onUpload}
        disabled={uploading}
        className={`${aspectClass} items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-dime-orange-300 bg-dime-orange-50`}
      >
        {uri ? (
          <Image source={{ uri }} className="h-full w-full" resizeMode="contain" />
        ) : (
          <View className="items-center">
            <Icon name="plus" size={20} color="#FC8019" />
            <Text className="mt-1 text-[10px] font-semibold text-dime-orange-700">{uploading ? "Uploading..." : "Upload"}</Text>
          </View>
        )}
      </Pressable>
      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="text-[11px] font-medium text-dime-ink-2">{label}</Text>
        {uri ? (
          <Pressable onPress={onClear} hitSlop={6}>
            <Text className="text-[10px] font-semibold text-dime-danger">Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
