import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { confirm, actionSheet } from "@/lib/confirm";
import QRCode from "react-native-qrcode-svg";
import { Badge, Button, Chip, ChipRow, Header, Icon, Input, Screen, Sheet, Stepper, haptic } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useTables } from "@/hooks/queries";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/store/toast";

const zoneFilters = ["all", "indoor", "outdoor", "rooftop", "private", "bar"] as const;
const zoneOptions: ("indoor" | "outdoor" | "rooftop" | "private" | "bar")[] = ["indoor", "outdoor", "rooftop", "private", "bar"];

export default function OwnerTables() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: tables, refetch } = useTables(restaurant?.id);
  const [zoneFilter, setZoneFilter] = useState<(typeof zoneFilters)[number]>("all");
  const [qrTable, setQrTable] = useState<Tables<"tables"> | null>(null);
  const [editor, setEditor] = useState<Partial<Tables<"tables">> | null>(null);

  useEffect(() => {
    if (!restaurant?.id) return;
    const ch = supabase
      .channel(`tables-${restaurant.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurant.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurant?.id]);

  const filtered = (tables ?? []).filter((t) => zoneFilter === "all" || t.zone === zoneFilter);
  const counts = {
    available: (tables ?? []).filter((t) => t.status === "available").length,
    occupied: (tables ?? []).filter((t) => t.status === "occupied").length,
    reserved: (tables ?? []).filter((t) => t.status === "reserved").length,
    blocked: (tables ?? []).filter((t) => t.status === "blocked").length,
  };

  async function setStatus(id: string, next: "available" | "occupied" | "reserved" | "blocked") {
    await supabase.from("tables").update({ status: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["tables"] });
    haptic.light();
  }

  async function deleteTable(id: string) {
    confirm("Delete table?", "All data linked to this table will be unlinked.", async () => {
      await supabase.from("tables").delete().eq("id", id);
      qc.invalidateQueries({ queryKey: ["tables"] });
    });
  }

  function nextNumber() {
    const used = new Set((tables ?? []).map((t) => t.number));
    let n = 1;
    while (used.has(n)) n++;
    return n;
  }

  return (
    <Screen scroll={false}>
      <Header
        title="Tables"
        subtitle={restaurant?.name}
        right={
          <Pressable
            onPress={() => setEditor({ number: nextNumber(), seats: 4, zone: "indoor" })}
            className="rounded-full bg-dime-primary-500 px-3 py-1.5"
          >
            <Text className="text-[12px] font-bold text-white">+ Table</Text>
          </Pressable>
        }
      />

      <View className="flex-row gap-2 px-5">
        <Summary color="bg-emerald-500" label="Available" value={counts.available} />
        <Summary color="bg-dime-danger" label="Occupied" value={counts.occupied} />
        <Summary color="bg-amber-500" label="Reserved" value={counts.reserved} />
        <Summary color="bg-gray-500" label="Blocked" value={counts.blocked} />
      </View>

      <View className="mt-4 px-5">
        <FlatList
          horizontal
          data={zoneFilters}
          keyExtractor={(z) => z}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Chip label={item} selected={zoneFilter === item} onPress={() => setZoneFilter(item)} />
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="tablecells" size={32} color="#BFBFBF" />
            <Text className="mt-3 text-[15px] font-bold text-dime-ink">No tables yet</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-3">Tap + Table to add your first one.</Text>
          </View>
        }
        renderItem={({ item: t }) => {
          const tone = {
            available: "bg-emerald-50 border-emerald-200",
            occupied: "bg-red-50 border-red-200",
            reserved: "bg-amber-50 border-amber-200",
            blocked: "bg-gray-100 border-gray-300",
          }[t.status];
          return (
            <Pressable onPress={() => setEditor(t)} className={`flex-1 overflow-hidden rounded-2xl border ${tone} p-4`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[20px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>#{t.number}</Text>
                <Badge
                  tone={t.status === "available" ? "green" : t.status === "occupied" ? "red" : t.status === "reserved" ? "orange" : "gray"}
                  label={t.status}
                />
              </View>
              <Text className="mt-1 text-[12px] text-dime-ink-2">{t.seats} seats • {t.zone}</Text>
              <View className="mt-4 flex-row gap-2">
                <Pressable
                  onPress={(e) => { e.stopPropagation(); setQrTable(t); }}
                  className="flex-1 items-center rounded-lg border border-neutral-50 bg-white py-2"
                >
                  <Icon name="qrcode" size={16} color="#FF6B2C" />
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    actionSheet("Status", [
                      { label: "Available", onPress: () => setStatus(t.id, "available") },
                      { label: "Reserved", onPress: () => setStatus(t.id, "reserved") },
                      { label: "Blocked", onPress: () => setStatus(t.id, "blocked") },
                      { label: "Delete", destructive: true, onPress: () => deleteTable(t.id) },
                    ]);
                  }}
                  className="flex-1 items-center rounded-lg border border-neutral-50 bg-white py-2"
                >
                  <Icon name="ellipsis" size={16} color="#8A8A8A" />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      <Sheet visible={!!qrTable} onClose={() => setQrTable(null)}>
        <Sheet.Body>
          {qrTable ? (
            <View className="items-center py-4">
              <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Table {qrTable.number}</Text>
              <Text className="mt-1 text-[12px] text-dime-ink-3">Print and place on the table</Text>
              <View className="mt-4 rounded-2xl border-4 border-dime-primary-500 p-4">
                <QRCode value={qrTable.qr_data} size={180} />
              </View>
              <View className="mt-4 items-center">
                <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{restaurant?.name}</Text>
                <Text className="text-[17px] font-bold text-dime-primary-600">Table #{qrTable.number}</Text>
              </View>
              <View className="mt-6 w-full">
                <Button label="Done" onPress={() => setQrTable(null)} fullWidth />
              </View>
            </View>
          ) : null}
        </Sheet.Body>
      </Sheet>

      <TableEditor
        table={editor}
        restaurantId={restaurant?.id}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          qc.invalidateQueries({ queryKey: ["tables"] });
        }}
      />
    </Screen>
  );
}

function TableEditor({
  table,
  restaurantId,
  onClose,
  onSaved,
}: {
  table: Partial<Tables<"tables">> | null;
  restaurantId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [number, setNumber] = useState("1");
  const [seats, setSeats] = useState(4);
  const [zone, setZone] = useState<typeof zoneOptions[number]>("indoor");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!table) return;
    setNumber(String(table.number ?? 1));
    setSeats(table.seats ?? 4);
    setZone((table.zone as typeof zoneOptions[number]) ?? "indoor");
  }, [table]);

  async function save() {
    if (!restaurantId) return;
    const n = parseInt(number, 10);
    if (!Number.isFinite(n) || n < 1) return toast.error("Enter a table number");
    setSaving(true);
    try {
      if (table?.id) {
        await supabase.from("tables").update({ number: n, seats, zone }).eq("id", table.id);
      } else {
        // qr_data is generated by the BEFORE INSERT trigger.
        await supabase.from("tables").insert({ restaurant_id: restaurantId, number: n, seats, zone });
      }
      haptic.success();
      onSaved();
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    } finally { setSaving(false); }
  }

  return (
    <Sheet visible={!!table} onClose={onClose} maxHeight="60%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{table?.id ? `Edit Table ${table.number}` : "New table"}</Text>
        <View className="mt-4 gap-4">
          <Input label="Table number" value={number} onChangeText={setNumber} keyboardType="number-pad" />
          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Seats</Text>
            <View className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <Text className="text-[15px] text-dime-ink">{seats} seats</Text>
              <Stepper value={seats} onChange={setSeats} min={1} max={20} size="sm" />
            </View>
          </View>
          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Zone</Text>
            <ChipRow>
              {zoneOptions.map((z) => (
                <Chip key={z} label={z} selected={zone === z} onPress={() => setZone(z)} />
              ))}
            </ChipRow>
          </View>
        </View>
        <View className="mt-5">
          <Button label={table?.id ? "Save" : "Add table"} loading={saving} onPress={save} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

function Summary({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} px-3 py-3`}>
      <Text className="text-[22px] font-bold text-white">{value}</Text>
      <Text className="text-[10px] font-bold uppercase text-white/90" style={{ letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}
