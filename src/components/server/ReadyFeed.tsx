import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";

type ReadyOrder = {
  id: string;
  order_number: string;
  table_id: string | null;
  total_amount: number;
  created_at: string;
  status: string;
  // Supabase joins return arrays even for single-foreign-key relations.
  tables: { number: number }[] | { number: number } | null;
  order_items: { id: string; name: string; quantity: number }[];
};

function tableNumber(t: ReadyOrder["tables"]): number | null {
  if (!t) return null;
  if (Array.isArray(t)) return t[0]?.number ?? null;
  return t.number;
}

/**
 * Surfaces orders that the chef has marked `ready` so a server can grab
 * them and walk them out. Realtime-subscribed for instant updates.
 */
export function ReadyFeed({ restaurantId, onTap }: { restaurantId?: string; onTap?: (orderId: string, tableId: string | null) => void }) {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["server-ready", restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, table_id, total_amount, created_at, status, tables(number), order_items(id, name, quantity)")
        .eq("restaurant_id", restaurantId!)
        .eq("status", "ready")
        .order("created_at");
      if (error) throw error;
      return data as unknown as ReadyOrder[];
    },
  });

  useEffect(() => {
    if (!restaurantId) return;
    const ch = supabase
      .channel(`ready-${restaurantId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, (payload) => {
        const newRow = payload.new as { status?: string };
        if (newRow.status === "ready") haptic.success();
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, refetch]);

  async function markServed(orderId: string) {
    await supabase.from("orders").update({ status: "served" }).eq("id", orderId);
    haptic.medium();
    qc.invalidateQueries({ queryKey: ["server-ready"] });
  }

  if (!data || data.length === 0) return null;

  return (
    <View className="mx-4 mt-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-3">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-emerald-500" />
        <Text className="text-[12px] font-bold uppercase tracking-widest text-emerald-700">Ready to serve</Text>
        <View className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5">
          <Text className="text-[11px] font-bold text-white">{data.length}</Text>
        </View>
      </View>
      <View className="mt-2 gap-2">
        {data.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => onTap?.(o.id, o.table_id)}
            className="flex-row items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
              <Text className="text-[12px] font-bold text-white">T{tableNumber(o.tables) ?? "—"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{o.order_number}</Text>
              <Text numberOfLines={1} className="text-[12px] text-dime-ink-2">
                {o.order_items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
              </Text>
              <Text className="text-[11px] text-dime-ink-3">{timeAgo(o.created_at)} • {rupees(o.total_amount)}</Text>
            </View>
            <Pressable
              onPress={(e) => { e.stopPropagation(); markServed(o.id); }}
              className="rounded-full bg-emerald-500 px-3 py-1.5"
            >
              <Text className="text-[12px] font-semibold text-white">Served</Text>
            </Pressable>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
