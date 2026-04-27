import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Avatar, Badge, Button, Chip, ChipRow, Header, Icon, Input, Screen, Sheet, haptic } from "@/components/ui";
import { confirm, actionSheet } from "@/lib/confirm";
import { useOwnedRestaurant, useRestaurantStaff } from "@/hooks/owner";
import { useTables } from "@/hooks/queries";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/store/toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const permissionKeys = [
  "view_all_data", "edit_restaurant_profile", "manage_staff", "edit_menu",
  "toggle_menu_availability", "view_revenue", "view_inventory", "log_expenses",
  "manage_offers", "access_floor_manager", "assign_tables", "manage_reservations",
  "take_orders", "view_kitchen_display", "mark_orders_prepared", "generate_bill",
  "apply_discount_low", "apply_discount_high", "void_order", "close_bill", "reply_to_reviews",
] as const;

const rolePresets: Record<string, Record<string, boolean>> = {
  manager: {
    view_all_data: true, edit_restaurant_profile: true, manage_staff: true, edit_menu: true,
    toggle_menu_availability: true, view_revenue: true, view_inventory: true, log_expenses: true,
    manage_offers: true, access_floor_manager: true, assign_tables: true, manage_reservations: true,
    take_orders: true, view_kitchen_display: true, mark_orders_prepared: true, generate_bill: true,
    apply_discount_low: true, apply_discount_high: true, void_order: true, close_bill: true, reply_to_reviews: true,
  },
  chef: {
    view_kitchen_display: true, mark_orders_prepared: true, view_inventory: true,
  },
  server: {
    take_orders: true, view_kitchen_display: true, generate_bill: true,
    access_floor_manager: true, apply_discount_low: true,
  },
  host: {
    manage_reservations: true, assign_tables: true, access_floor_manager: true,
  },
  cashier: {
    generate_bill: true, close_bill: true, apply_discount_low: true, view_revenue: true,
  },
};

const roleTone: Record<string, "orange" | "gold" | "blue" | "green" | "gray"> = {
  owner: "gold",
  manager: "orange",
  chef: "blue",
  server: "green",
  host: "green",
  cashier: "gray",
};

const roleOptions: ("manager" | "chef" | "server" | "host" | "cashier")[] = [
  "manager", "chef", "server", "host", "cashier",
];

const roleIcons: Record<string, string> = {
  owner: "crown.fill",
  manager: "person.badge.key.fill",
  chef: "frying.pan.fill",
  server: "tray.fill",
  host: "person.wave.2.fill",
  cashier: "creditcard.fill",
};

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 2,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function formatPermissionLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function Staff() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: staff, isLoading } = useRestaurantStaff(restaurant?.id);

  const [addVisible, setAddVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Tables<"staff"> | null>(null);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of staff ?? []) {
      counts[s.role] = (counts[s.role] ?? 0) + 1;
    }
    return counts;
  }, [staff]);

  const activeCount = useMemo(() => (staff ?? []).filter((s) => s.is_active).length, [staff]);

  function handleLongPress(s: Tables<"staff">) {
    if (s.role === "owner") return;
    actionSheet(s.name, [
      {
        label: s.is_active ? "Deactivate" : "Activate",
        onPress: () => toggleActive(s),
      },
      {
        label: "Delete",
        destructive: true,
        onPress: () => handleDelete(s),
      },
    ]);
  }

  async function toggleActive(s: Tables<"staff">) {
    try {
      const { error } = await supabase
        .from("staff")
        .update({ is_active: !s.is_active, updated_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
      haptic.success();
      toast.success(s.is_active ? "Staff deactivated" : "Staff activated");
    } catch (e) {
      haptic.error();
      toast.error("Failed to update", (e as Error).message);
    }
  }

  async function handleDelete(s: Tables<"staff">) {
    confirm("Delete staff member?", `This will permanently remove ${s.name} and unassign their tables.`, async () => {
      try {
        // Unassign any tables assigned to this staff member
        const { error: tableErr } = await supabase
          .from("tables")
          .update({ assigned_server_id: null })
          .eq("assigned_server_id", s.id);
        if (tableErr) throw tableErr;

        const { error } = await supabase.from("staff").delete().eq("id", s.id);
        if (error) throw error;

        qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
        qc.invalidateQueries({ queryKey: ["tables"] });
        haptic.success();
        toast.success("Staff deleted", `${s.name} has been removed.`);
      } catch (e) {
        haptic.error();
        toast.error("Failed to delete", (e as Error).message);
      }
    });
  }

  const renderItem = useCallback(
    ({ item: s }: { item: Tables<"staff"> }) => (
      <Pressable
        onPress={() => setEditTarget(s)}
        onLongPress={() => handleLongPress(s)}
        className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
        style={cardShadow}
      >
        <Avatar name={s.name} size={48} />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.3 }}>
              {s.name}
            </Text>
            {!s.is_active && (
              <Badge tone="red" label="Inactive" />
            )}
          </View>
          <Text className="mt-0.5 text-[12px] text-dime-ink-3">
            PIN {s.pin} {s.phone ? `• ${s.phone}` : ""}
          </Text>
          <View className="mt-1.5">
            <Badge tone={roleTone[s.role] ?? "gray"} label={s.role} />
          </View>
        </View>
        <Icon name="chevron.right" size={14} color="#C7C7CC" />
      </Pressable>
    ),
    [],
  );

  return (
    <Screen scroll={false}>
      <Header
        title="Staff"
        subtitle={`${staff?.length ?? 0} members • ${activeCount} active`}
        right={
          <Pressable
            onPress={() => setAddVisible(true)}
            className="rounded-full bg-dime-primary-500 px-3.5 py-1.5"
          >
            <Text className="text-[12px] font-bold text-white">+ Add Staff</Text>
          </Pressable>
        }
      />

      {/* Role summary tiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
        className="mb-2"
      >
        {(["owner", "manager", "chef", "server", "host", "cashier"] as const).map((role) => {
          const count = roleCounts[role] ?? 0;
          if (count === 0) return null;
          const bg = {
            owner: "bg-amber-500",
            manager: "bg-dime-primary-500",
            chef: "bg-blue-500",
            server: "bg-emerald-500",
            host: "bg-teal-500",
            cashier: "bg-neutral-500",
          }[role];
          return (
            <View key={role} className={`items-center rounded-2xl ${bg} px-4 py-3`} style={{ minWidth: 80 }}>
              <Text className="text-[20px] font-bold text-white">{count}</Text>
              <Text
                className="text-[9px] font-bold uppercase text-white/90"
                style={{ letterSpacing: 1.2 }}
              >
                {role}{count !== 1 ? "s" : ""}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B2C" />
        </View>
      ) : (
        <FlatList
          data={staff ?? []}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Icon name="person.3.fill" size={36} color="#BFBFBF" />
              <Text className="mt-3 text-[15px] font-bold text-dime-ink">No staff members</Text>
              <Text className="mt-1 text-[13px] text-dime-ink-3">
                Tap + Add Staff to get started.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Staff Sheet */}
      <AddStaffSheet
        visible={addVisible}
        restaurantId={restaurant?.id}
        existingPins={(staff ?? []).map((s) => s.pin)}
        onClose={() => setAddVisible(false)}
        onSaved={() => {
          setAddVisible(false);
          qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
        }}
      />

      {/* Edit Staff Sheet */}
      <EditStaffSheet
        staff={editTarget}
        restaurantId={restaurant?.id}
        existingPins={(staff ?? []).filter((s) => s.id !== editTarget?.id).map((s) => s.pin)}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
        }}
        onDeleted={() => {
          setEditTarget(null);
          qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
          qc.invalidateQueries({ queryKey: ["tables"] });
        }}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Add Staff Sheet
// ---------------------------------------------------------------------------

function AddStaffSheet({
  visible,
  restaurantId,
  existingPins,
  onClose,
  onSaved,
}: {
  visible: boolean;
  restaurantId?: string;
  existingPins: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<(typeof roleOptions)[number]>("server");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  // Errors
  const [nameErr, setNameErr] = useState("");
  const [pinErr, setPinErr] = useState("");

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      setName("");
      setPhone("");
      setRole("server");
      setPin(generateUniquePin(existingPins));
      setNameErr("");
      setPinErr("");
    }
  }, [visible]);

  function generateUniquePin(existing: string[]): string {
    const set = new Set(existing);
    let attempts = 0;
    let p = generatePin();
    while (set.has(p) && attempts < 100) {
      p = generatePin();
      attempts++;
    }
    return p;
  }

  function validate(): boolean {
    let valid = true;
    if (!name.trim()) {
      setNameErr("Name is required");
      valid = false;
    } else {
      setNameErr("");
    }
    if (!/^\d{4}$/.test(pin)) {
      setPinErr("PIN must be exactly 4 digits");
      valid = false;
    } else if (existingPins.includes(pin)) {
      setPinErr("This PIN is already in use");
      valid = false;
    } else {
      setPinErr("");
    }
    return valid;
  }

  async function save() {
    if (!restaurantId) return;
    if (!validate()) {
      haptic.error();
      return;
    }
    setSaving(true);
    try {
      const permissions = rolePresets[role] ?? {};
      const { error } = await supabase.from("staff").insert({
        restaurant_id: restaurantId,
        name: name.trim(),
        phone: phone.trim() || null,
        role,
        pin,
        permissions,
        is_active: true,
      });
      if (error) throw error;
      haptic.success();
      toast.success("Staff added", `${name.trim()} joined as ${role}.`);
      onSaved();
    } catch (e) {
      haptic.error();
      toast.error("Failed to add staff", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="85%">
      <Sheet.Body>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text
            className="text-[20px] font-bold text-dime-ink"
            style={{ letterSpacing: -0.5 }}
          >
            Add Staff Member
          </Text>
          <Text className="mt-1 text-[13px] text-dime-ink-3">
            New team members get default permissions based on their role.
          </Text>

          <View className="mt-6 gap-4">
            {/* Name */}
            <Input
              label="Name"
              placeholder="Full name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (nameErr) setNameErr("");
              }}
              error={nameErr}
              autoCapitalize="words"
            />

            {/* Phone */}
            <Input
              label="Phone"
              placeholder="Optional"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Role */}
            <View>
              <Text
                className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-dime-ink-3"
              >
                Role
              </Text>
              <ChipRow>
                {roleOptions.map((r) => (
                  <Chip
                    key={r}
                    label={r.charAt(0).toUpperCase() + r.slice(1)}
                    selected={role === r}
                    onPress={() => setRole(r)}
                  />
                ))}
              </ChipRow>
            </View>

            {/* PIN */}
            <View>
              <Input
                label="PIN"
                placeholder="4-digit PIN"
                value={pin}
                onChangeText={(v) => {
                  setPin(v.replace(/\D/g, "").slice(0, 4));
                  if (pinErr) setPinErr("");
                }}
                keyboardType="number-pad"
                maxLength={4}
                error={pinErr}
                trailing={
                  <Pressable
                    onPress={() => {
                      setPin(generateUniquePin(existingPins));
                      haptic.light();
                    }}
                    hitSlop={8}
                  >
                    <Icon name="arrow.clockwise" size={16} color="#FF6B2C" />
                  </Pressable>
                }
              />
              <Text className="mt-1 text-[11px] text-dime-ink-4">
                Staff use this PIN to clock in on the POS terminal.
              </Text>
            </View>

            {/* Default permissions preview */}
            <View>
              <Text
                className="mb-2 text-[11px] font-bold uppercase text-dime-ink-4"
                style={{ letterSpacing: 1.5 }}
              >
                Default Permissions ({role})
              </Text>
              <View className="rounded-2xl bg-white p-3" style={cardShadow}>
                {permissionKeys.map((k) => {
                  const enabled = !!rolePresets[role]?.[k];
                  return (
                    <View key={k} className="flex-row items-center justify-between py-1.5">
                      <Text
                        className={`flex-1 text-[12px] ${enabled ? "text-dime-ink-2" : "text-dime-ink-4"}`}
                      >
                        {formatPermissionLabel(k)}
                      </Text>
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full ${
                          enabled ? "bg-emerald-100" : "bg-neutral-100"
                        }`}
                      >
                        <Icon
                          name={enabled ? "checkmark" : "xmark"}
                          size={10}
                          color={enabled ? "#059669" : "#A3A3A3"}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text className="mt-1.5 text-[11px] text-dime-ink-4">
                You can customize permissions after adding.
              </Text>
            </View>
          </View>

          <View className="mt-6 gap-3">
            <Button label="Add Staff Member" loading={saving} onPress={save} fullWidth />
            <Button label="Cancel" variant="ghost" onPress={onClose} fullWidth />
          </View>
        </ScrollView>
      </Sheet.Body>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Edit Staff Sheet
// ---------------------------------------------------------------------------

function EditStaffSheet({
  staff,
  restaurantId,
  existingPins,
  onClose,
  onSaved,
  onDeleted,
}: {
  staff: Tables<"staff"> | null;
  restaurantId?: string;
  existingPins: string[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: tables } = useTables(restaurantId);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("server");
  const [pin, setPin] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Errors
  const [nameErr, setNameErr] = useState("");
  const [pinErr, setPinErr] = useState("");

  // Populate form when staff changes
  useEffect(() => {
    if (!staff) return;
    setName(staff.name);
    setPhone(staff.phone ?? "");
    setRole(staff.role);
    setPin(staff.pin);
    setPermissions(staff.permissions ?? {});
    setNameErr("");
    setPinErr("");
  }, [staff?.id]);

  const isOwner = staff?.role === "owner";
  const showTableAssignment = role === "server" || role === "host";

  // Tables assigned to this staff member
  const assignedTables = useMemo(
    () => (tables ?? []).filter((t) => t.assigned_server_id === staff?.id),
    [tables, staff?.id],
  );

  // Tables with no assignment (available to assign)
  const unassignedTables = useMemo(
    () => (tables ?? []).filter((t) => !t.assigned_server_id),
    [tables],
  );

  function validate(): boolean {
    let valid = true;
    if (!name.trim()) {
      setNameErr("Name is required");
      valid = false;
    } else {
      setNameErr("");
    }
    if (!/^\d{4}$/.test(pin)) {
      setPinErr("PIN must be exactly 4 digits");
      valid = false;
    } else if (existingPins.includes(pin)) {
      setPinErr("This PIN is already in use by another staff member");
      valid = false;
    } else {
      setPinErr("");
    }
    return valid;
  }

  function togglePermission(key: string) {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function resetPermissionsToPreset() {
    if (rolePresets[role]) {
      setPermissions({ ...rolePresets[role] });
      haptic.light();
      toast.info("Permissions reset", `Applied ${role} defaults.`);
    }
  }

  async function assignTable(tableId: string) {
    if (!staff) return;
    try {
      const { error } = await supabase
        .from("tables")
        .update({ assigned_server_id: staff.id })
        .eq("id", tableId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["tables"] });
      haptic.light();
    } catch (e) {
      haptic.error();
      toast.error("Failed to assign table", (e as Error).message);
    }
  }

  async function unassignTable(tableId: string) {
    try {
      const { error } = await supabase
        .from("tables")
        .update({ assigned_server_id: null })
        .eq("id", tableId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["tables"] });
      haptic.light();
    } catch (e) {
      haptic.error();
      toast.error("Failed to unassign table", (e as Error).message);
    }
  }

  async function save() {
    if (!staff || !restaurantId) return;
    if (!validate()) {
      haptic.error();
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
        pin,
        permissions,
        updated_at: new Date().toISOString(),
      };
      // Only allow role change for non-owners
      if (!isOwner) {
        updates.role = role;
      }
      const { error } = await supabase.from("staff").update(updates).eq("id", staff.id);
      if (error) throw error;
      haptic.success();
      toast.success("Staff updated", `${name.trim()} saved.`);
      onSaved();
    } catch (e) {
      haptic.error();
      toast.error("Failed to save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!staff) return;
    confirm(
      staff.is_active ? "Deactivate staff?" : "Activate staff?",
      staff.is_active
        ? `${staff.name} will lose access to the POS system.`
        : `${staff.name} will regain access.`,
      async () => {
        try {
          const { error } = await supabase
            .from("staff")
            .update({ is_active: !staff.is_active, updated_at: new Date().toISOString() })
            .eq("id", staff.id);
          if (error) throw error;
          qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
          haptic.success();
          toast.success(staff.is_active ? "Staff deactivated" : "Staff activated");
          onClose();
        } catch (e) {
          haptic.error();
          toast.error("Failed to update", (e as Error).message);
        }
      },
      staff.is_active,
    );
  }

  async function handleDelete() {
    if (!staff) return;
    confirm(
      "Delete staff member?",
      `This will permanently remove ${staff.name} and unassign their tables. This cannot be undone.`,
      async () => {
        try {
          // Unassign any tables assigned to this staff member
          await supabase
            .from("tables")
            .update({ assigned_server_id: null })
            .eq("assigned_server_id", staff.id);

          const { error } = await supabase.from("staff").delete().eq("id", staff.id);
          if (error) throw error;
          haptic.success();
          toast.success("Staff deleted", `${staff.name} has been removed.`);
          onDeleted();
        } catch (e) {
          haptic.error();
          toast.error("Failed to delete", (e as Error).message);
        }
      },
    );
  }

  return (
    <Sheet visible={!!staff} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        {staff ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Header */}
            <View className="mb-5 flex-row items-center gap-4">
              <Avatar name={name || staff.name} size={52} />
              <View className="flex-1">
                <Text
                  className="text-[18px] font-bold text-dime-ink"
                  style={{ letterSpacing: -0.5 }}
                >
                  {isOwner ? staff.name : "Edit Staff"}
                </Text>
                <View className="mt-1 flex-row items-center gap-2">
                  <Badge tone={roleTone[staff.role] ?? "gray"} label={staff.role} />
                  {!staff.is_active && <Badge tone="red" label="Inactive" />}
                </View>
              </View>
            </View>

            {/* Basic Info */}
            <Text
              className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4"
              style={{ letterSpacing: 1.5 }}
            >
              Basic Information
            </Text>
            <View className="gap-4">
              <Input
                label="Name"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (nameErr) setNameErr("");
                }}
                error={nameErr}
                autoCapitalize="words"
                editable={!isOwner}
              />
              <Input
                label="Phone"
                placeholder="Optional"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              {/* Role — not editable for owners */}
              {!isOwner && (
                <View>
                  <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-dime-ink-3">
                    Role
                  </Text>
                  <ChipRow>
                    {roleOptions.map((r) => (
                      <Chip
                        key={r}
                        label={r.charAt(0).toUpperCase() + r.slice(1)}
                        selected={role === r}
                        onPress={() => setRole(r)}
                      />
                    ))}
                  </ChipRow>
                </View>
              )}

              {/* PIN */}
              <Input
                label="PIN"
                placeholder="4-digit PIN"
                value={pin}
                onChangeText={(v) => {
                  setPin(v.replace(/\D/g, "").slice(0, 4));
                  if (pinErr) setPinErr("");
                }}
                keyboardType="number-pad"
                maxLength={4}
                error={pinErr}
                trailing={
                  <Pressable
                    onPress={() => {
                      const set = new Set(existingPins);
                      let attempts = 0;
                      let p = generatePin();
                      while (set.has(p) && attempts < 100) {
                        p = generatePin();
                        attempts++;
                      }
                      setPin(p);
                      haptic.light();
                    }}
                    hitSlop={8}
                  >
                    <Icon name="arrow.clockwise" size={16} color="#FF6B2C" />
                  </Pressable>
                }
              />
            </View>

            {/* Table Assignment — only for server/host */}
            {showTableAssignment && (
              <View className="mt-6">
                <Text
                  className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4"
                  style={{ letterSpacing: 1.5 }}
                >
                  Assigned Tables
                </Text>

                {assignedTables.length > 0 ? (
                  <View className="rounded-2xl bg-white p-3" style={cardShadow}>
                    <View className="flex-row flex-wrap gap-2">
                      {assignedTables.map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => unassignTable(t.id)}
                          className="flex-row items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2"
                        >
                          <Text className="text-[13px] font-semibold text-emerald-700">
                            #{t.number}
                          </Text>
                          <Icon name="xmark" size={10} color="#059669" />
                        </Pressable>
                      ))}
                    </View>
                    <Text className="mt-2 text-[11px] text-dime-ink-4">
                      Tap to unassign
                    </Text>
                  </View>
                ) : (
                  <View className="items-center rounded-2xl bg-white py-6" style={cardShadow}>
                    <Icon name="tablecells" size={24} color="#BFBFBF" />
                    <Text className="mt-2 text-[12px] text-dime-ink-3">No tables assigned</Text>
                  </View>
                )}

                {unassignedTables.length > 0 && (
                  <View className="mt-3">
                    <Text className="mb-2 text-[11px] font-bold text-dime-ink-4">
                      Available tables (tap to assign)
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {unassignedTables.map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => assignTable(t.id)}
                          className="flex-row items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2"
                        >
                          <Text className="text-[13px] font-semibold text-dime-ink-2">
                            #{t.number}
                          </Text>
                          <Text className="text-[10px] text-dime-ink-4">{t.zone}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Permissions */}
            <View className="mt-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text
                  className="text-[11px] font-bold uppercase text-dime-ink-4"
                  style={{ letterSpacing: 1.5 }}
                >
                  Permissions
                </Text>
                {!isOwner && rolePresets[role] && (
                  <Pressable onPress={resetPermissionsToPreset} hitSlop={8}>
                    <Text className="text-[12px] font-semibold text-dime-primary-500">
                      Reset to {role} defaults
                    </Text>
                  </Pressable>
                )}
              </View>
              <View className="gap-0.5 rounded-2xl bg-white p-1" style={cardShadow}>
                {permissionKeys.map((k) => (
                  <View
                    key={k}
                    className="flex-row items-center justify-between rounded-xl px-3 py-2.5"
                  >
                    <Text className="flex-1 text-[13px] text-dime-ink-2">
                      {formatPermissionLabel(k)}
                    </Text>
                    <Switch
                      value={!!permissions[k]}
                      onValueChange={() => togglePermission(k)}
                      trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }}
                      disabled={isOwner}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Save */}
            <View className="mt-6">
              <Button label="Save Changes" loading={saving} onPress={save} fullWidth />
            </View>

            {/* Danger zone — not for owners */}
            {!isOwner && (
              <View className="mt-8">
                <Text
                  className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4"
                  style={{ letterSpacing: 1.5 }}
                >
                  Danger Zone
                </Text>
                <View className="gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-[14px] font-semibold text-dime-ink">
                        {staff.is_active ? "Deactivate" : "Activate"} Staff
                      </Text>
                      <Text className="text-[12px] text-dime-ink-3">
                        {staff.is_active
                          ? "Removes POS access. Can be reactivated later."
                          : "Restores POS access for this staff member."}
                      </Text>
                    </View>
                    <Button
                      label={staff.is_active ? "Deactivate" : "Activate"}
                      variant={staff.is_active ? "secondary" : "primary"}
                      size="sm"
                      onPress={handleDeactivate}
                    />
                  </View>
                  <View className="h-px bg-red-100" />
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-[14px] font-semibold text-dime-ink">
                        Delete Staff
                      </Text>
                      <Text className="text-[12px] text-dime-ink-3">
                        Permanently removes this member. Cannot be undone.
                      </Text>
                    </View>
                    <Button
                      label="Delete"
                      variant="destructive"
                      size="sm"
                      onPress={handleDelete}
                    />
                  </View>
                </View>
              </View>
            )}

            <View className="mt-4">
              <Button label="Done" variant="ghost" onPress={onClose} fullWidth />
            </View>
          </ScrollView>
        ) : null}
      </Sheet.Body>
    </Sheet>
  );
}
