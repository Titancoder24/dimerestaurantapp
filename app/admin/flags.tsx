import { useEffect, useState } from "react";
import { FlatList, Pressable, Switch, Text, View } from "react-native";
import { confirm } from "@/lib/confirm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Header, Icon, Input, Screen, Sheet, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";

type Flag = Tables<"feature_flags">;

export default function FeatureFlagsScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const [composing, setComposing] = useState<Partial<Flag> | null>(null);

  const { data } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feature_flags").select("*").order("key");
      if (error) throw error;
      return data as Flag[];
    },
  });

  async function toggle(id: string, enabled: boolean) {
    await supabase.from("feature_flags").update({ enabled: !enabled, rollout_percent: enabled ? 0 : 100 }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
    haptic.light();
  }

  async function setRollout(id: string, percent: number) {
    await supabase.from("feature_flags").update({ rollout_percent: percent }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["feature-flags"] });
  }

  async function destroy(id: string) {
    confirm("Delete flag?", "Anything reading this flag will get the default (off).", async () => {
      await supabase.from("feature_flags").delete().eq("id", id);
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
    });
  }

  return (
    <Screen scroll={false}>
      <Header
        title="Feature Flags"
        subtitle={`${(data ?? []).length} flags`}
        right={
          <Pressable onPress={() => setComposing({})} className="rounded-full bg-dime-primary-500 px-3 py-1.5">
            <Text className="text-[12px] font-bold text-white">+ New</Text>
          </Pressable>
        }
      />

      <View className="mx-5 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <View className="flex-row items-center gap-2">
          <View className="rounded-xl bg-dime-primary-50 p-1.5">
            <Icon name="info.circle" size={14} color="#FF6B2C" />
          </View>
          <Text className="text-[13px] font-bold text-dime-ink">Rollout</Text>
        </View>
        <Text className="mt-1 text-[12px] text-dime-ink-3">
          Toggle features platform-wide. Use rollout percent for staged launches — clients hash on user ID and only the matching slice sees the change.
        </Text>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        renderItem={({ item: f }) => (
          <View className="rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-[14px] font-bold text-dime-ink">{f.key}</Text>
              <Badge tone={f.enabled ? "green" : "gray"} label={f.enabled ? "On" : "Off"} />
              <Switch
                value={f.enabled}
                onValueChange={() => toggle(f.id, f.enabled)}
                trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }}
              />
            </View>
            {f.description ? <Text className="mt-1 text-[12px] text-dime-ink-2">{f.description}</Text> : null}

            <View className="mt-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Rollout</Text>
                <Text className="text-[12px] font-bold text-dime-primary-600">{f.rollout_percent}%</Text>
              </View>
              <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-dime-bg-2">
                <View style={{ width: `${f.rollout_percent}%` }} className="h-full bg-dime-primary-500" />
              </View>
              <View className="mt-2 flex-row gap-1">
                {[0, 10, 25, 50, 75, 100].map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setRollout(f.id, p)}
                    className={`flex-1 items-center rounded-md py-1 ${f.rollout_percent === p ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
                  >
                    <Text className={`text-[11px] font-bold ${f.rollout_percent === p ? "text-dime-primary-700" : "text-dime-ink-2"}`}>{p}%</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setComposing(f)} className="flex-1 items-center rounded-lg bg-white py-2" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                <Text className="text-[12px] font-bold text-dime-ink-2">Edit</Text>
              </Pressable>
              <Pressable onPress={() => destroy(f.id)} className="flex-1 items-center rounded-lg border border-red-300 bg-white py-2">
                <Text className="text-[12px] font-bold text-dime-danger">Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <FlagEditor
        flag={composing}
        onClose={() => setComposing(null)}
        onSaved={() => { setComposing(null); qc.invalidateQueries({ queryKey: ["feature-flags"] }); }}
      />
    </Screen>
  );
}

function FlagEditor({ flag, onClose, onSaved }: { flag: Partial<Flag> | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setKey(flag?.key ?? "");
    setDescription(flag?.description ?? "");
  }, [flag?.id, flag?.key]);

  async function save() {
    if (!/^[a-z0-9_]+$/.test(key)) return toast.error("Key must be lowercase letters, digits, underscores");
    setSaving(true);
    try {
      if (flag?.id) {
        await supabase.from("feature_flags").update({ key, description }).eq("id", flag.id);
      } else {
        await supabase.from("feature_flags").insert({ key, description, enabled: false, rollout_percent: 0 });
      }
      haptic.success();
      onSaved();
      setKey(""); setDescription("");
    } catch (e) { toast.error("Could not save", (e as Error).message); }
    finally { setSaving(false); }
  }

  if (!flag) return null;

  return (
    <Sheet visible={!!flag} onClose={onClose} maxHeight="60%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{flag.id ? "Edit flag" : "New flag"}</Text>
        <View className="mt-4 gap-4">
          <Input label="Key" value={key} onChangeText={setKey} placeholder="snake_case_only" autoCapitalize="none" />
          <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        </View>
        <View className="mt-5">
          <Button label="Save" loading={saving} onPress={save} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}
