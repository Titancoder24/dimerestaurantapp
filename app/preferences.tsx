import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Chip, ChipRow, Header, Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";

const prefs = ["Vegetarian", "Vegan", "Jain", "Eggetarian", "Gluten-free", "Low-carb", "Low-spice", "High-protein"];
const allergens = ["Peanuts", "Tree nuts", "Dairy", "Gluten", "Shellfish", "Egg", "Soy", "Sesame"];

export default function Preferences() {
  const profile = useAuth((s) => s.profile);
  const refresh = useAuth((s) => s.refreshProfile);
  const toast = useToast();
  const [selectedPrefs, setPrefs] = useState<string[]>(profile?.food_preferences ?? []);
  const [selectedAllergens, setAllergens] = useState<string[]>(profile?.allergens ?? []);
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], setter: (v: string[]) => void, val: string) => {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      await supabase.from("users").update({ food_preferences: selectedPrefs, allergens: selectedAllergens }).eq("id", profile.id);
      await refresh();
      toast.success("Preferences saved");
    } finally { setSaving(false); }
  }

  return (
    <Screen>
      <Header title="Preferences" back />
      <View className="px-4">
        <Text className="mb-2 text-[13px] font-semibold text-dime-ink-2">Food preferences</Text>
        <ChipRow>
          {prefs.map((p) => (
            <Chip key={p} label={p} selected={selectedPrefs.includes(p)} onPress={() => toggle(selectedPrefs, setPrefs, p)} />
          ))}
        </ChipRow>
      </View>
      <View className="mt-5 px-4">
        <Text className="mb-2 text-[13px] font-semibold text-dime-ink-2">Allergens</Text>
        <ChipRow>
          {allergens.map((a) => (
            <Chip key={a} label={a} selected={selectedAllergens.includes(a)} onPress={() => toggle(selectedAllergens, setAllergens, a)} />
          ))}
        </ChipRow>
      </View>
      <View className="mx-4 mt-6">
        <Button label="Save" loading={saving} onPress={save} fullWidth />
      </View>
    </Screen>
  );
}
