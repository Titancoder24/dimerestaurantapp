// Owner staff management — invite managers/servers, see live roster, delete.
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Sheet, Button, Icon, haptic } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

type StaffRow = {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  role: string;
  pin: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  user?: { name: string | null; email: string; avatar_url: string | null } | null;
};

type InviteRow = {
  id: string;
  code: string;
  restaurant_id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  pin: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

const ROLE_DOT: Record<string, string> = {
  owner: "#FF5A1F",
  manager: "#6F5BFF",
  server: "#0F8A4F",
  host: "#3358D4",
  chef: "#D43A2F",
  cashier: "#D97706",
};

export default function OwnerStaff() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const qc = useQueryClient();
  const toast = useToast();

  const { data: staff } = useQuery({
    queryKey: ["staff", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*, user:users(name, email, avatar_url)")
        .eq("restaurant_id", restaurant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StaffRow[];
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["staff_invites", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invites")
        .select("*")
        .eq("restaurant_id", restaurant!.id)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InviteRow[];
    },
  });

  const inviteMut = useMutation({
    mutationFn: async (params: { name: string; email: string; phone?: string; role: string; pin?: string }) => {
      if (!restaurant?.id || !me?.id) throw new Error("No restaurant");
      const insert: Record<string, unknown> = {
        restaurant_id: restaurant.id,
        email: params.email.trim().toLowerCase(),
        name: params.name.trim(),
        phone: params.phone?.trim() || null,
        role: params.role,
        invited_by: me.id,
      };
      if (params.pin?.trim()) insert.pin = params.pin.trim();
      const { data, error } = await supabase.from("staff_invites").insert(insert as never).select().single();
      if (error) throw error;
      return data as InviteRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff_invites"] }),
  });

  const deleteStaff = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase.rpc("owner_delete_staff", { p_staff_id: staffId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff removed");
    },
  });

  const revokeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from("staff_invites").delete().eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff_invites"] }),
  });

  const [showInvite, setShowInvite] = useState(false);
  const [iName, setIName] = useState("");
  const [iEmail, setIEmail] = useState("");
  const [iPhone, setIPhone] = useState("");
  const [iRole, setIRole] = useState<"manager" | "server" | "host" | "chef" | "cashier">("manager");
  const [iPin, setIPin] = useState("");
  const [createdInvite, setCreatedInvite] = useState<InviteRow | null>(null);

  const submitInvite = async () => {
    if (!iName.trim() || !iEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      const inv = await inviteMut.mutateAsync({
        name: iName, email: iEmail, phone: iPhone, role: iRole, pin: iPin || undefined,
      });
      setCreatedInvite(inv);
      setIName(""); setIEmail(""); setIPhone(""); setIPin("");
      haptic.success();
    } catch (e) {
      toast.error("Could not invite", (e as Error).message);
    }
  };

  const inviteUrl = (code: string) => {
    if (typeof window !== "undefined") return `${window.location.origin}/invite/${code}`;
    return `https://dimerestaurantapp.vercel.app/invite/${code}`;
  };

  const copyInvite = async (url: string) => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied");
        return;
      } catch {
        // fall through
      }
    }
    toast.success("Link", url);
  };

  const list = staff ?? [];
  const managers = list.filter((s) => s.role === "manager" && s.is_active).length;
  const servers = list.filter((s) => s.role === "server" && s.is_active).length;
  const pending = (invites ?? []).length;
  const total = list.filter((s) => s.is_active).length;

  return (
    <PageScroll>
      <PageHeader
        title="Staff & roles"
        subtitle="Invite managers and servers. Each gets a unique invite link."
        rightAction="Invite staff"
        actionIcon="plus"
        onAction={() => { setCreatedInvite(null); setShowInvite(true); }}
      />

      <StatRow>
        <StatTile icon="person.2.fill" label="Active staff" value={String(total)} hint="Currently on roster" />
        <StatTile icon="briefcase.fill" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Managers" value={String(managers)} hint="Admin-level access" />
        <StatTile icon="figure.walk" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Servers" value={String(servers)} hint="Floor + service access" />
        <StatTile icon="hourglass" iconColor="#D97706" iconBg="#FFF7E0" label="Pending invites" value={String(pending)} hint="Awaiting redemption" />
      </StatRow>

      <CardShell>
        <CardHeader title="Active staff" subtitle={`${list.length} ${list.length === 1 ? "member" : "members"}`} />
        {list.length === 0 ? (
          <EmptyState
            icon="person.2.fill"
            title="No staff yet"
            body="Invite managers to access the dashboard, or servers to take orders. Each gets their own login and you can revoke access any time."
            actionLabel="Invite first staff"
            onAction={() => { setCreatedInvite(null); setShowInvite(true); }}
          />
        ) : null}
        {list.map((s, i) => (
          <View
            key={s.id}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE,
            }}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 999,
                backgroundColor: "#F5F5F4",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: OWNER_INK }}>
                {(s.user?.name ?? s.name).split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{s.user?.name ?? s.name}</Text>
              <View style={{ marginTop: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <StatusDot color={ROLE_DOT[s.role] ?? OWNER_MUTED} />
                <MonoText size={11} color={OWNER_MUTED}>
                  {s.role.toUpperCase()} · PIN {s.pin} · joined {timeAgo(s.created_at)}
                </MonoText>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View
                style={{
                  paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4,
                  backgroundColor: s.is_active ? "#E6F4ED" : "#F5F5F4",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: s.is_active ? "#0F8A4F" : OWNER_MUTED, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                  {s.is_active ? "ACTIVE" : "OFF"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (Platform.OS === "web" && !window.confirm(`Remove ${s.name}? They'll lose access immediately.`)) return;
                  deleteStaff.mutate(s.id);
                }}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  backgroundColor: "#FCEAE6",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="trash.fill" size={11} color="#D43A2F" />
              </Pressable>
            </View>
          </View>
        ))}
      </CardShell>

      <CardShell>
        <CardHeader title="Pending invites" subtitle={`${pending} unredeemed`} />
        {pending === 0 ? (
          <EmptyState
            icon="paperplane.fill"
            title="No pending invites"
            body="When you invite someone, the link appears here until they sign up. Links expire after 14 days."
            compact
          />
        ) : null}
        {(invites ?? []).map((inv, i) => {
          const url = inviteUrl(inv.code);
          return (
            <View
              key={inv.id}
              style={{
                paddingHorizontal: 18, paddingVertical: 12,
                borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#FFF7E0", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="hourglass" size={13} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>
                    {inv.name} · <Text style={{ color: OWNER_MUTED, fontWeight: "500" }}>{inv.email}</Text>
                  </Text>
                  <MonoText size={11} color={OWNER_MUTED}>
                    {inv.role.toUpperCase()} · PIN {inv.pin} · expires {new Date(inv.expires_at).toLocaleDateString()}
                  </MonoText>
                </View>
                <Pressable
                  onPress={() => copyInvite(url)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: OWNER_INK }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Copy link</Text>
                </Pressable>
                <Pressable
                  onPress={() => revokeInvite.mutate(inv.id)}
                  style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#FCEAE6", alignItems: "center", justifyContent: "center" }}
                >
                  <Icon name="xmark" size={11} color="#D43A2F" />
                </Pressable>
              </View>
              <Text numberOfLines={1} style={{ marginTop: 6, fontSize: 11, color: OWNER_ACCENT, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }}>
                {url}
              </Text>
            </View>
          );
        })}
      </CardShell>

      <Sheet visible={showInvite} onClose={() => setShowInvite(false)} maxHeight="92%">
        <Sheet.Body>
          {createdInvite ? (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: "#E6F4ED", alignItems: "center", justifyContent: "center" }}>
                <Icon name="checkmark.circle.fill" size={28} color="#0F8A4F" />
              </View>
              <Text style={{ marginTop: 14, fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>
                Invite created
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: OWNER_MUTED, textAlign: "center", maxWidth: 320 }}>
                Share this link with <Text style={{ fontWeight: "700" }}>{createdInvite.name}</Text>. They'll set a password and be linked as a <Text style={{ fontWeight: "700" }}>{createdInvite.role}</Text>.
              </Text>
              <View
                style={{
                  marginTop: 18, alignSelf: "stretch",
                  backgroundColor: "#F5F5F4", padding: 14, borderRadius: 10,
                  borderWidth: 1, borderColor: OWNER_HAIRLINE,
                }}
              >
                <MonoText size={12} color={OWNER_INK}>{inviteUrl(createdInvite.code)}</MonoText>
                <Text style={{ marginTop: 6, fontSize: 11, color: OWNER_MUTED }}>
                  Server PIN: <MonoText size={11} weight="700">{createdInvite.pin}</MonoText> · Expires {new Date(createdInvite.expires_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ marginTop: 16, alignSelf: "stretch", flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Copy link" onPress={() => copyInvite(inviteUrl(createdInvite.code))} fullWidth />
                </View>
                <Button label="Done" variant="secondary" onPress={() => setShowInvite(false)} />
              </View>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Invite staff</Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: OWNER_MUTED }}>
                They get a unique link to set their password and join your restaurant.
              </Text>
              <View style={{ marginTop: 16, gap: 12 }}>
                <Input label="Full name" value={iName} onChangeText={setIName} placeholder="e.g. Aarav Mehta" />
                <Input label="Email" value={iEmail} onChangeText={setIEmail} keyboardType="email-address" autoCapitalize="none" placeholder="aarav@example.com" />
                <Input label="Phone (optional)" value={iPhone} onChangeText={setIPhone} keyboardType="phone-pad" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: OWNER_MUTED, letterSpacing: 1 }}>ROLE</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {(["manager", "server", "host", "chef", "cashier"] as const).map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setIRole(r)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7,
                        backgroundColor: iRole === r ? OWNER_INK : "#fff",
                        borderWidth: 1, borderColor: iRole === r ? OWNER_INK : OWNER_HAIRLINE,
                        flexDirection: "row", alignItems: "center", gap: 5,
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ROLE_DOT[r] ?? OWNER_MUTED }} />
                      <Text style={{ fontSize: 12, fontWeight: "600", color: iRole === r ? "#fff" : OWNER_INK, textTransform: "capitalize" }}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
                <Input label="PIN (optional — auto-generated if blank)" value={iPin} onChangeText={setIPin} keyboardType="number-pad" placeholder="4-digit" />
                <Button label="Generate invite link" onPress={submitInvite} loading={inviteMut.isPending} />
              </View>
            </View>
          )}
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
