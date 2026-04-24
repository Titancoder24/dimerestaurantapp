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

  // Realtime subscription
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

      <View className="mx-4 flex-row items-center gap-2 rounded-full bg-dime-bg-2 px-3 py-1.5 self-start">
        <View className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-gray-400"}`} />
        <Text className="text-[11px] uppercase tracking-widest text-dime-ink-3">{isLive ? "Live" : "Offline"}</Text>
      </View>

      <View className="mx-4 mt-4 rounded-2xl bg-white border border-dime-border p-4">
        {flow.map((step, idx) => {
          const active = idx <= currentIdx;
          const current = idx === currentIdx;
          return (
            <View key={step.key} className="flex-row gap-3">
              <View className="items-center">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    active ? "bg-dime-orange-500" : "bg-dime-bg-2"
                  }`}
                >
                  <Icon name={step.icon} size={16} color={active ? "#fff" : "#C7C7CC"} />
                </View>
                {idx < flow.length - 1 ? (
                  <View className={`my-1 h-10 w-0.5 ${active ? "bg-dime-orange-500" : "bg-dime-border"}`} />
                ) : null}
              </View>
              <View className="flex-1 pb-6">
                <Text className={`text-[15px] font-semibold ${current ? "text-dime-orange-600" : active ? "text-dime-ink" : "text-dime-ink-3"}`}>
                  {step.title}
                </Text>
                <Text className="mt-0.5 text-[12px] text-dime-ink-3">{step.description}</Text>
                {current ? (
                  <View className="mt-1 flex-row items-center gap-1">
                    <View className="h-1.5 w-1.5 rounded-full bg-dime-orange-500" />
                    <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-orange-600">In progress</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Items */}
      <View className="mx-4 mt-4 rounded-2xl bg-white border border-dime-border">
        <View className="border-b border-dime-border p-4">
          <Text className="text-[15px] font-semibold text-dime-ink">Your items</Text>
        </View>
        {items.map((item, idx) => (
          <View key={item.id} className={`flex-row items-center gap-3 p-4 ${idx > 0 ? "border-t border-dime-border" : ""}`}>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-dime-orange-50">
              <Text className="text-[13px] font-semibold text-dime-orange-700">{item.quantity}×</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-medium text-dime-ink">{item.name}</Text>
              {item.special_instructions ? (
                <Text className="text-[12px] italic text-dime-ink-3">{item.special_instructions}</Text>
              ) : null}
            </View>
            <Text className="text-[13px] font-semibold text-dime-ink-2">{rupees(item.line_total)}</Text>
          </View>
        ))}
      </View>

      <View className="mx-4 mt-4 rounded-2xl bg-white border border-dime-border p-4">
        <Row label="Subtotal" value={rupees(order?.subtotal)} />
        {order && order.discount_amount > 0 && <Row label="Discount" value={`- ${rupees(order.discount_amount)}`} positive />}
        <Row label="GST" value={rupees(order?.tax_amount)} />
        {order && order.service_charge_amount > 0 && <Row label="Service charge" value={rupees(order.service_charge_amount)} />}
        {order && order.tip_amount > 0 && <Row label="Tip" value={rupees(order.tip_amount)} />}
        <View className="mt-2 border-t border-dime-border pt-2">
          <Row label="Total" value={rupees(order?.total_amount)} bold />
        </View>
      </View>

      {order?.status === "served" || order?.status === "paid" ? (
        <View className="mx-4 mt-4 gap-2">
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
    <View className="flex-row items-center justify-between py-1">
      <Text className={bold ? "text-[15px] font-semibold text-dime-ink" : "text-[13px] text-dime-ink-2"}>{label}</Text>
      <Text className={`${bold ? "text-[17px] font-semibold" : "text-[13px]"} ${positive ? "text-emerald-600" : "text-dime-ink"}`}>{value}</Text>
    </View>
  );
}
