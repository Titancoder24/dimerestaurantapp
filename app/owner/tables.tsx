import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Button, Chip, Header, Icon, Screen, Sheet, haptic } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useTables } from "@/hooks/queries";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const zoneFilters = ["all", "indoor", "outdoor", "rooftop", "private", "bar"] as const;

export default function OwnerTables() {
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: tables, refetch } = useTables(restaurant?.id);
  const [zoneFilter, setZoneFilter] = useState<(typeof zoneFilters)[number]>("all");
  const [qrTable, setQrTable] = useState<Tables<"tables"> | null>(null);

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

  return (
    <Screen scroll={false}>
      <Header title="Tables" subtitle={restaurant?.name} />
      <View className="flex-row gap-2 px-4">
        <Summary color="bg-emerald-500" label="Available" value={counts.available} />
        <Summary color="bg-dime-danger" label="Occupied" value={counts.occupied} />
        <Summary color="bg-amber-500" label="Reserved" value={counts.reserved} />
        <Summary color="bg-gray-500" label="Blocked" value={counts.blocked} />
      </View>

      <View className="mt-3 px-4">
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
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        renderItem={({ item: t }) => {
          const tone = {
            available: "bg-emerald-50 border-emerald-200",
            occupied: "bg-red-50 border-red-200",
            reserved: "bg-amber-50 border-amber-200",
            blocked: "bg-gray-100 border-gray-300",
          }[t.status];
          return (
            <View className={`flex-1 overflow-hidden rounded-2xl border ${tone} p-3`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[20px] font-bold text-dime-ink">#{t.number}</Text>
                <Badge
                  tone={t.status === "available" ? "green" : t.status === "occupied" ? "red" : t.status === "reserved" ? "orange" : "gray"}
                  label={t.status}
                />
              </View>
              <Text className="mt-1 text-[12px] text-dime-ink-2">{t.seats} seats • {t.zone}</Text>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => setQrTable(t)}
                  className="flex-1 items-center rounded-lg border border-dime-border bg-white py-2"
                >
                  <Icon name="qrcode" size={16} color="#FC8019" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert("Change status", "Update table status", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Available", onPress: () => setStatus(t.id, "available") },
                      { text: "Reserved", onPress: () => setStatus(t.id, "reserved") },
                      { text: "Blocked", onPress: () => setStatus(t.id, "blocked") },
                    ]);
                  }}
                  className="flex-1 items-center rounded-lg border border-dime-border bg-white py-2"
                >
                  <Icon name="ellipsis" size={16} color="#8E8E93" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Sheet visible={!!qrTable} onClose={() => setQrTable(null)}>
        <Sheet.Body>
          {qrTable ? (
            <View className="items-center py-4">
              <Text className="text-[18px] font-semibold text-dime-ink">Table {qrTable.number}</Text>
              <Text className="mt-1 text-[12px] text-dime-ink-3">Print and place at the table</Text>
              <View className="mt-4 rounded-2xl border-4 border-dime-orange-500 p-4">
                <QRCode value={qrTable.qr_data} size={180} />
              </View>
              <View className="mt-4 items-center">
                <Text className="text-[11px] uppercase tracking-widest text-dime-ink-3">dime.app</Text>
                <Text className="text-[17px] font-semibold text-dime-orange-600">Table #{qrTable.number}</Text>
              </View>
              <View className="mt-6 w-full">
                <Button label="Done" onPress={() => setQrTable(null)} fullWidth />
              </View>
            </View>
          ) : null}
        </Sheet.Body>
      </Sheet>
    </Screen>
  );
}

function Summary({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} px-3 py-3`}>
      <Text className="text-[22px] font-bold text-white">{value}</Text>
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/90">{label}</Text>
    </View>
  );
}
