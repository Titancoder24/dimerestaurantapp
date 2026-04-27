import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { actionSheet } from "@/lib/confirm";
import { useRouter } from "expo-router";
import { Avatar, Badge, Header, Icon, Screen, haptic } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { useTables } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { ReadyFeed } from "@/components/server/ReadyFeed";
import { UpcomingArrivalsFeed } from "@/components/server/UpcomingArrivalsFeed";

export default function ServerTables() {
  const router = useRouter();
  const qc = useQueryClient();
  const staff = useAuth((s) => s.staff);
  const setStaff = useAuth((s) => s.setStaff);
  const { data: tables, refetch } = useTables(staff?.restaurantId);

  useEffect(() => {
    if (!staff?.restaurantId) return;
    const ch = supabase
      .channel(`server-tables-${staff.restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tables", filter: `restaurant_id=eq.${staff.restaurantId}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [staff?.restaurantId]);

  useEffect(() => {
    if (!staff) requestAnimationFrame(() => router.replace("/server/login"));
  }, [staff, router]);

  if (!staff) return null;

  const my = (tables ?? []).filter((t) => t.assigned_server_id === staff.id || !t.assigned_server_id);
  const occupied = my.filter((t) => t.status === "occupied");
  const available = my.filter((t) => t.status === "available");
  const reserved = my.filter((t) => t.status === "reserved");

  const openActions = (id: string) => {
    actionSheet("Table actions", [
      { label: "Open bill", onPress: () => router.push({ pathname: "/server/bill/[tableId]", params: { tableId: id } }) },
      { label: "Mark available", onPress: async () => { await supabase.from("tables").update({ status: "available" }).eq("id", id); qc.invalidateQueries({ queryKey: ["tables"] }); } },
      { label: "Mark occupied", onPress: async () => { await supabase.from("tables").update({ status: "occupied", assigned_server_id: staff.id }).eq("id", id); qc.invalidateQueries({ queryKey: ["tables"] }); } },
    ]);
  };

  return (
    <Screen scroll={false}>
      <Header
        title={`Hello, ${staff.name.split(" ")[0]}`}
        subtitle={`${staff.role}`}
        right={
          <Pressable
            onPress={() => { setStaff(null); router.replace("/server/login"); }}
            className="h-9 w-9 items-center justify-center rounded-full bg-dime-bg-2"
          >
            <Icon name="lock.fill" size={14} color="#1C1C1E" />
          </Pressable>
        }
      />

      <View className="flex-row gap-4 px-5">
        <Tile color="bg-dime-danger" label="Occupied" value={occupied.length} />
        <Tile color="bg-emerald-500" label="Available" value={available.length} />
        <Tile color="bg-amber-500" label="Reserved" value={reserved.length} />
      </View>

      <UpcomingArrivalsFeed restaurantId={staff.restaurantId} />

      <ReadyFeed
        restaurantId={staff.restaurantId}
        onTap={(orderId, tableId) => {
          if (tableId) router.push({ pathname: "/server/bill/[tableId]", params: { tableId } });
        }}
      />

      <FlatList
        data={my}
        keyExtractor={(t) => t.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        renderItem={({ item: t }) => {
          const tone = {
            available: "bg-emerald-50",
            occupied: "bg-red-50",
            reserved: "bg-amber-50",
            blocked: "bg-gray-100",
          }[t.status];
          return (
            <Pressable
              onPress={() => { haptic.light(); openActions(t.id); }}
              className={`flex-1 rounded-2xl p-4 ${tone}`}
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>#{t.number}</Text>
                <Badge tone={t.status === "available" ? "green" : t.status === "occupied" ? "red" : "orange"} label={t.status} />
              </View>
              <Text className="mt-1 text-[12px] text-dime-ink-2">{t.seats} seats • {t.zone}</Text>
              {t.assigned_server_id === staff.id ? (
                <View className="mt-2 flex-row items-center gap-1.5">
                  <Avatar name={staff.name} size={22} />
                  <Text className="text-[11px] text-dime-ink-3">Your table</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />

      <View className="absolute bottom-6 right-4">
        <Pressable
          onPress={() => router.push("/scan")}
          className="h-14 items-center justify-center rounded-full bg-dime-primary-500 px-5 flex-row gap-2"
          style={{ shadowColor: "#FF6B2C", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 }}
        >
          <Icon name="qrcode.viewfinder" size={16} color="#fff" />
          <Text className="text-[14px] font-semibold text-white">Scan to take order</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Tile({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} py-3`}>
      <Text className="text-[28px] font-bold text-white">{value}</Text>
      <Text className="text-[11px] font-semibold uppercase tracking-widest text-white/90">{label}</Text>
    </View>
  );
}
