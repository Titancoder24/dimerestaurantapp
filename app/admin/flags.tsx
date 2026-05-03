import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { confirm } from "@/lib/confirm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Icon, Input, Sheet, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_GREEN, ADMIN_RED, ADMIN_MONO,
} from "@/components/admin/shell";

type Flag = Tables<"feature_flags">;

export default function FeatureFlagsScreen() {
  const qc = useQueryClient();
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

  const list = data ?? [];

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · SYSTEM · ENGINEERING"
        title="Feature flags"
        subtitle={`${list.length} flags · staged rollouts hashed on user ID`}
        rightAction="New flag"
        actionIcon="plus"
        onAction={() => setComposing({})}
      />

      <CardShell padded>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#2B1810", borderWidth: 1, borderColor: "#5C2E18", alignItems: "center", justifyContent: "center" }}>
            <Icon name="info.circle.fill" size={14} color={ADMIN_ACCENT} />
          </View>
          <Text style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK }}>How rollouts work</Text>
        </View>
        <Text style={{ marginTop: 8, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 19 }}>
          Toggle a flag platform-wide, or use the rollout percent for staged launches. Clients hash on user ID, so only the matching slice of users sees the change. Increase percent gradually as confidence grows.
        </Text>
      </CardShell>

      <CardShell>
        <CardHeader title="All flags" subtitle={`${list.length} configured`} />
        {list.length === 0 ? (
          <EmptyState icon="sparkles" title="No flags yet" body="Add a flag to gate new features behind a kill switch or staged launch." compact />
        ) : null}
        {list.map((f, i) => (
          <View
            key={f.id}
            style={{
              paddingHorizontal: 18, paddingVertical: 16,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MonoText size={13.5} weight="700" color={ADMIN_INK}>{f.key}</MonoText>
              <Pill tone={f.enabled ? "green" : "neutral"}>{f.enabled ? "On" : "Off"}</Pill>
              <View style={{ flex: 1 }} />
              <Switch
                value={f.enabled}
                onValueChange={() => toggle(f.id, f.enabled)}
                trackColor={{ true: ADMIN_ACCENT, false: "#262626" }}
                thumbColor="#FFFFFF"
              />
            </View>
            {f.description ? (
              <Text style={{ marginTop: 6, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 18 }}>{f.description}</Text>
            ) : null}

            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <MonoText size={10.5} color={ADMIN_INK3}>ROLLOUT</MonoText>
                <MonoText size={11.5} weight="700" color={ADMIN_ACCENT}>{f.rollout_percent}%</MonoText>
              </View>
              <View style={{ marginTop: 6, height: 6, borderRadius: 3, backgroundColor: ADMIN_HAIRLINE, overflow: "hidden" }}>
                <View style={{ width: `${f.rollout_percent}%`, height: "100%", backgroundColor: ADMIN_ACCENT }} />
              </View>
              <View style={{ marginTop: 10, flexDirection: "row", gap: 4 }}>
                {[0, 10, 25, 50, 75, 100].map((p) => {
                  const active = f.rollout_percent === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setRollout(f.id, p)}
                      style={{
                        flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 6,
                        backgroundColor: active ? ADMIN_ACCENT : ADMIN_PANEL2,
                        borderWidth: 1, borderColor: active ? ADMIN_ACCENT : ADMIN_HAIRLINE2,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "#1A0A04" : ADMIN_INK2, fontFamily: ADMIN_MONO }}>
                        {p}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 14, flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setComposing(f)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 7,
                  backgroundColor: ADMIN_PANEL, borderWidth: 1, borderColor: ADMIN_HAIRLINE,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: ADMIN_INK2 }}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => destroy(f.id)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 7,
                  backgroundColor: "#3A1212", borderWidth: 1, borderColor: "#5C1E1E",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: ADMIN_RED }}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </CardShell>

      <FlagEditor
        flag={composing}
        onClose={() => setComposing(null)}
        onSaved={() => { setComposing(null); qc.invalidateQueries({ queryKey: ["feature-flags"] }); }}
      />
    </PageScroll>
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
