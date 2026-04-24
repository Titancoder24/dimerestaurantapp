import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { Button, Chip, ChipRow, Header, Input, Screen } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { useQueryClient } from "@tanstack/react-query";

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

  return (
    <Screen>
      <Header title="Restaurant settings" />
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
