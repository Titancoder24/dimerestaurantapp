import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Chip, Header, Screen, haptic } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import { useAuth } from "@/store/auth";

type SplitMode = "none" | "equally" | "items";

export default function BillScreen() {
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const staff = useAuth((s) => s.staff);

  const { data: order, refetch } = useQuery({
    queryKey: ["server-table-order", tableId],
    enabled: !!tableId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("table_id", tableId!)
        .neq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as (null | ({
        id: string; subtotal: number; tax_amount: number; service_charge_amount: number;
        discount_amount: number; tip_amount: number; total_amount: number; status: string;
        order_number: string;
        order_items: { id: string; name: string; quantity: number; line_total: number }[];
      }));
    },
  });

  const [splitMode, setSplitMode] = useState<SplitMode>("none");
  const [splitCount, setSplitCount] = useState(2);
  const [closing, setClosing] = useState(false);

  const perPerson = useMemo(() => {
    if (!order) return 0;
    if (splitMode === "equally") return Math.ceil(order.total_amount / splitCount);
    return 0;
  }, [order, splitMode, splitCount]);

  async function close() {
    if (!order) return;
    if (!staff?.permissions?.close_bill) return;
    setClosing(true);
    try {
      await supabase.from("orders").update({ status: "paid", payment_status: "paid" }).eq("id", order.id);
      haptic.success();
      qc.invalidateQueries();
      router.replace("/server/tables");
    } finally { setClosing(false); }
  }

  if (!order) {
    return (
      <Screen>
        <Header title="Bill" back />
        <View className="items-center p-10">
          <Text className="text-[14px] text-dime-ink-3">No active order on this table.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={`Bill — ${order.order_number}`} back />

      <View className="mx-5 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
        {order.order_items.map((it) => (
          <View key={it.id} className="flex-row items-center justify-between py-1.5">
            <Text className="flex-1 text-[13px] text-dime-ink-2">{it.quantity}× {it.name}</Text>
            <Text className="text-[13px] font-medium text-dime-ink">{rupees(it.line_total)}</Text>
          </View>
        ))}
        <View className="mt-3 border-t border-neutral-50 pt-2">
          <Row label="Subtotal" value={rupees(order.subtotal)} />
          <Row label="GST" value={rupees(order.tax_amount)} />
          {order.service_charge_amount > 0 && <Row label="Service" value={rupees(order.service_charge_amount)} />}
          {order.discount_amount > 0 && <Row label="Discount" value={`- ${rupees(order.discount_amount)}`} positive />}
          {order.tip_amount > 0 && <Row label="Tip" value={rupees(order.tip_amount)} />}
          <View className="mt-2 border-t border-neutral-50 pt-2">
            <Row label="Total" value={rupees(order.total_amount)} bold />
          </View>
        </View>
      </View>

      <View className="mx-5 mt-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
        <Text className="text-[14px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Split bill</Text>
        <View className="mt-2 flex-row gap-2">
          <Chip label="None" selected={splitMode === "none"} onPress={() => setSplitMode("none")} />
          <Chip label="Equally" selected={splitMode === "equally"} onPress={() => setSplitMode("equally")} />
          <Chip label="By items" selected={splitMode === "items"} onPress={() => setSplitMode("items")} />
        </View>
        {splitMode === "equally" ? (
          <View className="mt-3 flex-row items-center gap-4">
            <Text className="text-[13px] text-dime-ink-2">People</Text>
            <View className="flex-row gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <Chip key={n} label={String(n)} selected={splitCount === n} onPress={() => setSplitCount(n)} />
              ))}
            </View>
            <View className="ml-auto">
              <Badge tone="orange" label={`${rupees(perPerson)} / person`} />
            </View>
          </View>
        ) : null}
        {splitMode === "items" ? (
          <Text className="mt-3 text-[12px] text-dime-ink-3">Drag each item to a person column at the counter to apportion totals. (Simplified here.)</Text>
        ) : null}
      </View>

      <View className="mx-5 mt-5">
        <Button
          label="Close bill — mark paid"
          size="lg"
          loading={closing}
          disabled={!staff?.permissions?.close_bill}
          onPress={close}
          fullWidth
        />
        {!staff?.permissions?.close_bill ? (
          <Text className="mt-2 text-center text-[11px] text-dime-ink-3">You don't have permission to close bills.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={bold ? "text-[15px] font-semibold text-dime-ink" : "text-[13px] text-dime-ink-2"}>{label}</Text>
      <Text className={`${bold ? "text-[17px] font-semibold" : "text-[13px]"} ${positive ? "text-emerald-600" : "text-dime-ink"}`}>{value}</Text>
    </View>
  );
}
