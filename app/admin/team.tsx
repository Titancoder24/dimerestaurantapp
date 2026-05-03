import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { confirm } from "@/lib/confirm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Chip, ChipRow, Icon, Input, Sheet, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE,
  ADMIN_HOVER, ADMIN_ACCENT, ADMIN_MONO,
} from "@/components/admin/shell";

type AdminRole = "super" | "support" | "marketing" | "sales" | "ops" | "finance" | "engineering" | "intern";
type TeamMember = Tables<"users"> & { admin_role: AdminRole | null };

type PillTone = "neutral" | "saffron" | "lilac" | "green" | "red" | "amber";

const roleMeta: Record<AdminRole, { label: string; tone: PillTone; description: string }> = {
  super:      { label: "Super",       tone: "amber",   description: "Full access, can invite team" },
  support:    { label: "Support",     tone: "lilac",   description: "Tickets, complaints, customer help" },
  marketing:  { label: "Marketing",   tone: "saffron", description: "Campaigns, banners, collections" },
  sales:      { label: "Sales",       tone: "green",   description: "Restaurant onboarding pipeline" },
  ops:        { label: "Operations",  tone: "lilac",   description: "Live ops, mission control, performance" },
  finance:    { label: "Finance",     tone: "green",   description: "Revenue, refunds, payouts" },
  engineering:{ label: "Engineering", tone: "neutral", description: "Feature flags, audit log, system" },
  intern:     { label: "Intern",      tone: "neutral", description: "Read-only across most surfaces" },
};

const allPermissions = [
  "manage_team", "manage_billing", "manage_flags", "manage_campaigns",
  "view_revenue", "view_audit", "view_risk", "view_cohorts",
  "manage_content", "manage_restaurants", "manage_users",
];

const presets: Record<AdminRole, Record<string, boolean>> = {
  super: Object.fromEntries(allPermissions.map((p) => [p, true])),
  support: { manage_users: true, view_risk: true },
  marketing: { manage_campaigns: true, manage_content: true, view_cohorts: true },
  sales: { manage_restaurants: true, view_revenue: true },
  ops: { view_revenue: true, view_risk: true, manage_users: true },
  finance: { view_revenue: true, manage_billing: true, view_audit: true },
  engineering: { manage_flags: true, view_audit: true },
  intern: {},
};

export default function AdminTeam() {
  const qc = useQueryClient();
  const toast = useToast();
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const { data: team } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "super_admin")
        .order("admin_role")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const counts: Record<string, number> = {};
  (team ?? []).forEach((m) => {
    if (!m.admin_role) return;
    counts[m.admin_role] = (counts[m.admin_role] ?? 0) + 1;
  });

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · PLATFORM · PEOPLE"
        title="Team & roles"
        subtitle={`${team?.length ?? 0} members across ${Object.keys(counts).length} departments`}
        rightAction="Invite"
        actionIcon="plus"
        onAction={() => setInviting(true)}
      />

      <CardShell padded>
        <Text style={{ fontSize: 11, fontWeight: "700", color: ADMIN_INK3, letterSpacing: 1.2, fontFamily: ADMIN_MONO }}>
          DEPARTMENTS
        </Text>
        <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(roleMeta).map(([k, m]) => (
            <Pill key={k} tone={m.tone}>
              {m.label} · {counts[k] ?? 0}
            </Pill>
          ))}
        </View>
      </CardShell>

      <CardShell>
        <CardHeader title="Members" subtitle={`${team?.length ?? 0} active super-admins`} />
        {(team ?? []).length === 0 ? (
          <EmptyState
            icon="person.fill"
            title="No team yet"
            body="Tap Invite to bring on the first admin teammate."
            actionLabel="Invite first member"
            onAction={() => setInviting(true)}
            compact
          />
        ) : null}
        {(team ?? []).map((item, i) => {
          const meta = item.admin_role ? roleMeta[item.admin_role] : null;
          return (
            <Pressable
              key={item.id}
              onPress={() => setEditing(item)}
              style={({ hovered }: any) => ({
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingHorizontal: 18, paddingVertical: 14,
                borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
                backgroundColor: hovered ? ADMIN_HOVER : "transparent",
              })}
            >
              <Avatar name={item.name ?? item.email} uri={item.avatar_url} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK }}>{item.name ?? "Unnamed"}</Text>
                <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: ADMIN_INK2 }}>{item.email}</Text>
                <View style={{ marginTop: 5, flexDirection: "row", gap: 6 }}>
                  {meta ? <Pill tone={meta.tone}>{meta.label}</Pill> : <Pill>No role</Pill>}
                  <Pill tone={item.is_active ? "green" : "red"}>{item.is_active ? "Active" : "Suspended"}</Pill>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <MonoText size={10.5} color={ADMIN_INK3}>JOINED {timeAgo(item.created_at).toUpperCase()}</MonoText>
              </View>
              <Icon name="chevron.right" size={13} color={ADMIN_INK3} />
            </Pressable>
          );
        })}
      </CardShell>

      <InviteSheet
        visible={inviting}
        onClose={() => setInviting(false)}
        onInvited={() => { setInviting(false); qc.invalidateQueries({ queryKey: ["admin-team"] }); }}
      />

      <EditSheet
        member={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-team"] }); }}
      />
    </PageScroll>
  );
}

function InviteSheet({ visible, onClose, onInvited }: { visible: boolean; onClose: () => void; onInvited: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [saving, setSaving] = useState(false);

  async function invite() {
    if (!email.includes("@")) return toast.error("Enter a valid email");
    if (name.trim().length < 2) return toast.error("Enter a name");
    setSaving(true);
    try {
      // Generate a placeholder password — in production this should use
      // supabase.auth.admin.inviteUserByEmail() via a service-role edge
      // function. For the MVP we create the auth row inline.
      const tempPassword = Math.random().toString(36).slice(-12) + "A1!";
      const { data, error } = await supabase.auth.signUp({
        email, password: tempPassword,
        options: { data: { name, role: "super_admin" } },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from("users").update({
          role: "super_admin",
          admin_role: role,
          admin_permissions: presets[role],
          name,
        }).eq("id", data.user.id);
      }
      haptic.success();
      toast.success("Invite created", `Temp password: ${tempPassword.slice(0, 6)}…  (Share securely.)`);
      onInvited();
    } catch (e) {
      haptic.error();
      toast.error("Could not invite", (e as Error).message);
    } finally { setSaving(false); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="80%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Invite team member</Text>
        <Text className="mt-1 text-[12px] text-dime-ink-3">They'll get the role-default permissions, which you can fine-tune after.</Text>

        <View className="mt-4 gap-4">
          <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Aisha Khan" />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="aisha@dime.app" />

          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Department</Text>
            <View className="gap-2">
              {(Object.keys(roleMeta) as AdminRole[]).map((k) => {
                const m = roleMeta[k];
                const selected = role === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => { haptic.select(); setRole(k); }}
                    className={`flex-row items-center gap-4 rounded-xl p-4 ${selected ? "bg-dime-primary-50" : "bg-white"}`}
                    style={selected ? undefined : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                  >
                    <Pill tone={m.tone}>{m.label}</Pill>
                    <Text className="flex-1 text-[12px] text-dime-ink-2">{m.description}</Text>
                    {selected ? <Icon name="checkmark.circle.fill" size={16} color="#FF6B2C" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mt-5">
          <Button label="Send invite" loading={saving} onPress={invite} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

function EditSheet({ member, onClose, onSaved }: { member: TeamMember | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [role, setRole] = useState<AdminRole>("support");
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setRole(member.admin_role ?? "support");
    setPerms(member.admin_permissions ?? {});
  }, [member?.id]);

  if (!member) return null;

  function pickRole(r: AdminRole) {
    setRole(r);
    setPerms(presets[r]);
  }

  async function save() {
    setSaving(true);
    try {
      await supabase.from("users").update({ admin_role: role, admin_permissions: perms }).eq("id", member!.id);
      haptic.success();
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    } finally { setSaving(false); }
  }

  async function suspend() {
    confirm("Suspend member?", "They'll lose access immediately.", async () => {
      await supabase.from("users").update({ is_active: false }).eq("id", member!.id);
      onSaved();
    });
  }

  return (
    <Sheet visible={!!member} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        <View className="flex-row items-center gap-4">
          <Avatar name={member.name ?? member.email} size={44} />
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{member.name ?? "—"}</Text>
            <Text className="text-[12px] text-dime-ink-3">{member.email}</Text>
          </View>
        </View>

        <View className="mt-4">
          <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Role</Text>
          <ChipRow>
            {(Object.keys(roleMeta) as AdminRole[]).map((k) => (
              <Chip key={k} label={roleMeta[k].label} selected={role === k} onPress={() => pickRole(k)} />
            ))}
          </ChipRow>
        </View>

        <View className="mt-4">
          <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Permissions</Text>
          <View className="rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            {allPermissions.map((p, i) => (
              <View key={p} className={`flex-row items-center justify-between p-4 ${i > 0 ? "border-t border-neutral-50" : ""}`}>
                <Text className="flex-1 text-[13px] text-dime-ink">{p.replace(/_/g, " ")}</Text>
                <Switch
                  value={!!perms[p]}
                  onValueChange={() => setPerms({ ...perms, [p]: !perms[p] })}
                  trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }}
                />
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5 flex-row gap-2">
          <View className="flex-1"><Button label="Suspend" variant="destructive" onPress={suspend} fullWidth /></View>
          <View className="flex-[2]"><Button label="Save" loading={saving} onPress={save} fullWidth /></View>
        </View>
      </Sheet.Body>
    </Sheet>
  );
}
