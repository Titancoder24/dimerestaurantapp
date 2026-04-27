import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Header, Icon, Screen, haptic } from "@/components/ui";
import { useOrder } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import type { Tables } from "@/lib/supabase";

type OrderStatus = Tables<"orders">["status"];

const flow: { key: OrderStatus; title: string; description: string; icon: string }[] = [
  { key: "received", title: "Received", description: "Restaurant has your order", icon: "checkmark.circle.fill" },
  { key: "preparing", title: "Preparing", description: "Chef is cooking", icon: "flame.fill" },
  { key: "ready", title: "Ready", description: "Ready to be served", icon: "bag.fill" },
  { key: "served", title: "Served", description: "Enjoy your meal!", icon: "fork.knife" },
  { key: "paid", title: "Complete", description: "Bill closed", icon: "checkmark.circle.fill" },
];

export default function OrderTracker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, refetch } = useOrder(id);
  const order = data?.order;
  const items = data?.items ?? [];
  const [isLive, setLive] = useState(true);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => {
        refetch();
        haptic.light();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${id}` }, () => {
        refetch();
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch]);

  const currentIdx = order ? flow.findIndex((f) => f.key === order.status) : 0;

  return (
    <Screen>
      <Header
        title={order?.order_number ?? "Order"}
        subtitle={(order as { restaurants?: { name?: string } } | undefined)?.restaurants?.name ?? ""}
        back
      />

      <View className="mx-5 flex-row items-center gap-2 self-start rounded-full bg-dime-bg-2 px-4 py-2">
        <View className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-neutral-400"}`} />
        <Text className="text-[11px] font-bold uppercase text-dime-ink-3" style={{ letterSpacing: 1.5 }}>
          {isLive ? "Live" : "Offline"}
        </Text>
      </View>

      <View className="mx-5 mt-5 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        {flow.map((step, idx) => {
          const active = idx <= currentIdx;
          const current = idx === currentIdx;
          return (
            <View key={step.key} className="flex-row gap-4">
              <View className="items-center">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    active ? "bg-dime-primary-500" : "bg-dime-bg-2"
                  }`}
                >
                  <Icon name={step.icon} size={16} color={active ? "#fff" : "#BFBFBF"} />
                </View>
                {idx < flow.length - 1 ? (
                  <View className={`my-1 h-10 w-0.5 ${active ? "bg-dime-primary-500" : "bg-neutral-100"}`} />
                ) : null}
              </View>
              <View className="flex-1 pb-6">
                <Text className={`text-[15px] font-bold ${current ? "text-dime-primary-600" : active ? "text-dime-ink" : "text-dime-ink-4"}`}>
                  {step.title}
                </Text>
                <Text className="mt-0.5 text-[13px] text-dime-ink-3">{step.description}</Text>
                {current ? (
                  <View className="mt-1.5 flex-row items-center gap-1.5">
                    <View className="h-1.5 w-1.5 rounded-full bg-dime-primary-500" />
                    <Text className="text-[10px] font-bold uppercase text-dime-primary-600" style={{ letterSpacing: 1.5 }}>
                      In progress
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <View className="mx-5 mt-5 overflow-hidden rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
        <View className="border-b border-neutral-50 px-5 py-4">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Your items</Text>
        </View>
        {items.map((item, idx) => (
          <View key={item.id} className={`flex-row items-center gap-4 px-5 py-3.5 ${idx > 0 ? "border-t border-neutral-50" : ""}`}>
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-primary-50">
              <Text className="text-[13px] font-bold text-dime-primary-600">{item.quantity}×</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-dime-ink">{item.name}</Text>
              {item.special_instructions ? (
                <Text className="text-[12px] italic text-dime-ink-4">{item.special_instructions}</Text>
              ) : null}
            </View>
            <Text className="text-[14px] font-semibold text-dime-ink-2">{rupees(item.line_total)}</Text>
          </View>
        ))}
      </View>

      <View className="mx-5 mt-5 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
        <Row label="Subtotal" value={rupees(order?.subtotal)} />
        {order && order.discount_amount > 0 && <Row label="Discount" value={`- ${rupees(order.discount_amount)}`} positive />}
        <Row label="GST" value={rupees(order?.tax_amount)} />
        {order && order.service_charge_amount > 0 && <Row label="Service charge" value={rupees(order.service_charge_amount)} />}
        {order && order.tip_amount > 0 && <Row label="Tip" value={rupees(order.tip_amount)} />}
        <View className="mt-3 border-t border-neutral-100 pt-3">
          <Row label="Total" value={rupees(order?.total_amount)} bold />
        </View>
      </View>

      {order?.status === "served" || order?.status === "paid" ? (
        <View className="mx-5 mt-5 gap-3 pb-8">
          <Button
            label="Rate your experience"
            onPress={() => router.push({ pathname: "/review/[id]", params: { id: order.id } })}
            leading={<Icon name="star.fill" size={14} color="#fff" />}
            fullWidth
          />
          <Button
            label="Reorder"
            variant="secondary"
            onPress={() => router.push({ pathname: "/menu/[id]", params: { id: order.restaurant_id } })}
            fullWidth
          />
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className={bold ? "text-[16px] font-bold text-dime-ink" : "text-[14px] text-dime-ink-2"}>{label}</Text>
      <Text className={`${bold ? "text-[18px] font-bold" : "text-[14px] font-medium"} ${positive ? "text-emerald-600" : "text-dime-ink"}`}>{value}</Text>
    </View>
  );
}
