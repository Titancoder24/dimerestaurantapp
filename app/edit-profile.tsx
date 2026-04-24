import { useState } from "react";
import { View } from "react-native";
import { Button, Header, Input, Screen } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { useRouter } from "expo-router";

export default function EditProfile() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const refresh = useAuth((s) => s.refreshProfile);
  const toast = useToast();
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [dob, setDob] = useState(profile?.dob ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("users").update({ name, phone, dob: dob || null }).eq("id", profile.id);
      if (error) throw error;
      await refresh();
      toast.success("Profile updated");
      router.back();
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    } finally { setSaving(false); }
  }

  return (
    <Screen>
      <Header title="Edit Profile" back />
      <View className="px-4 gap-3">
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Date of birth" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} />
      </View>
      <View className="mx-4 mt-6">
        <Button label="Save changes" loading={saving} onPress={save} fullWidth />
      </View>
    </Screen>
  );
}
