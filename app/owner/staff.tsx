import { useState } from "react";
import { FlatList, Pressable, Switch, Text, View } from "react-native";
import { Avatar, Badge, Button, Header, Icon, Screen, Sheet } from "@/components/ui";
import { useOwnedRestaurant, useRestaurantStaff } from "@/hooks/owner";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const permissionKeys = [
  "view_all_data", "edit_restaurant_profile", "manage_staff", "edit_menu",
  "toggle_menu_availability", "view_revenue", "view_inventory", "log_expenses",
  "manage_offers", "access_floor_manager", "assign_tables", "manage_reservations",
  "take_orders", "view_kitchen_display", "mark_orders_prepared", "generate_bill",
  "apply_discount_low", "apply_discount_high", "void_order", "close_bill", "reply_to_reviews",
] as const;

const roleTone: Record<string, "orange" | "gold" | "blue" | "green" | "gray"> = {
  owner: "gold",
  manager: "orange",
  chef: "blue",
  server: "green",
  host: "green",
  cashier: "gray",
};

export default function Staff() {
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: staff } = useRestaurantStaff(restaurant?.id);
  const [edit, setEdit] = useState<Tables<"staff"> | null>(null);

  async function togglePermission(staffId: string, perms: Record<string, boolean>, key: string) {
    const next = { ...perms, [key]: !perms[key] };
    await supabase.from("staff").update({ permissions: next }).eq("id", staffId);
    qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
    if (edit && edit.id === staffId) setEdit({ ...edit, permissions: next });
  }

  async function toggleActive(s: Tables<"staff">) {
    await supabase.from("staff").update({ is_active: !s.is_active }).eq("id", s.id);
    qc.invalidateQueries({ queryKey: ["restaurant-staff"] });
  }

  return (
    <Screen scroll={false}>
      <Header title="Staff" subtitle={`${staff?.length ?? 0} members`} />
      <FlatList
        data={staff ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 120 }}
        renderItem={({ item: s }) => (
          <Pressable onPress={() => setEdit(s)} className="flex-row items-center gap-3 rounded-2xl border border-dime-border bg-white p-3">
            <Avatar name={s.name} size={44} />
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{s.name}</Text>
              <Text className="text-[11px] text-dime-ink-3">PIN {s.pin} • {s.phone ?? "—"}</Text>
              <View className="mt-1">
                <Badge tone={roleTone[s.role] ?? "gray"} label={s.role} />
              </View>
            </View>
            <Switch
              value={s.is_active}
              onValueChange={() => toggleActive(s)}
              trackColor={{ true: "#FC8019", false: "#D1D1D6" }}
            />
          </Pressable>
        )}
      />

      <Sheet visible={!!edit} onClose={() => setEdit(null)} maxHeight="90%">
        <Sheet.Body>
          {edit ? (
            <View>
              <View className="mb-3 flex-row items-center gap-3">
                <Avatar name={edit.name} size={48} />
                <View className="flex-1">
                  <Text className="text-[16px] font-semibold text-dime-ink">{edit.name}</Text>
                  <Text className="text-[12px] text-dime-ink-3">PIN {edit.pin} • {edit.role}</Text>
                </View>
              </View>
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">Permissions</Text>
              <View className="max-h-[460px] gap-1 rounded-2xl border border-dime-border bg-white p-1">
                {permissionKeys.map((k) => (
                  <View key={k} className="flex-row items-center justify-between rounded-xl px-3 py-2">
                    <Text className="flex-1 text-[13px] text-dime-ink-2">{k.replace(/_/g, " ")}</Text>
                    <Switch
                      value={!!edit.permissions?.[k]}
                      onValueChange={() => togglePermission(edit.id, edit.permissions ?? {}, k)}
                      trackColor={{ true: "#FC8019", false: "#D1D1D6" }}
                    />
                  </View>
                ))}
              </View>
              <View className="mt-4">
                <Button label="Done" onPress={() => setEdit(null)} fullWidth />
              </View>
            </View>
          ) : null}
        </Sheet.Body>
      </Sheet>
    </Screen>
  );
}
