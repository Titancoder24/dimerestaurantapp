import { FlatList, Text, View } from "react-native";
import { Badge, Header, Icon, Screen } from "@/components/ui";
import { useOwnedRestaurant, useInventory, useExpenses } from "@/hooks/owner";
import { rupees, shortDate } from "@/lib/format";

export default function Inventory() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: inv } = useInventory(restaurant?.id);
  const { data: exp } = useExpenses(restaurant?.id);

  const totalExpense = (exp ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const monthExpense = (exp ?? []).filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Screen>
      <Header title="Inventory & Expenses" />

      <View className="mx-4 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-white border border-dime-border p-4">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">This month</Text>
          <Text className="mt-1 text-[22px] font-semibold text-dime-ink">{rupees(monthExpense)}</Text>
          <Text className="text-[11px] text-dime-ink-3">{(exp ?? []).length} entries total</Text>
        </View>
        <View className="flex-1 rounded-2xl bg-white border border-dime-border p-4">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">All-time</Text>
          <Text className="mt-1 text-[22px] font-semibold text-dime-ink">{rupees(totalExpense)}</Text>
        </View>
      </View>

      <View className="mx-4 mt-5">
        <Text className="mb-2 text-[15px] font-semibold text-dime-ink">Stock levels</Text>
        <View className="rounded-2xl overflow-hidden border border-dime-border bg-white">
          {(inv ?? []).map((i, idx) => {
            const status = i.quantity <= 0 ? "out" : i.quantity <= i.min_threshold ? "low" : "ok";
            return (
              <View key={i.id} className={`flex-row items-center justify-between p-3 ${idx > 0 ? "border-t border-dime-border" : ""}`}>
                <View className="flex-1">
                  <Text className="text-[14px] font-medium text-dime-ink">{i.name}</Text>
                  <Text className="text-[12px] text-dime-ink-3">{i.quantity} {i.unit} • {i.supplier_name ?? "—"}</Text>
                </View>
                <Badge tone={status === "out" ? "red" : status === "low" ? "orange" : "green"} label={status === "out" ? "Out" : status === "low" ? "Low" : "OK"} />
              </View>
            );
          })}
        </View>
      </View>

      <View className="mx-4 mt-5">
        <Text className="mb-2 text-[15px] font-semibold text-dime-ink">Recent expenses</Text>
        <View className="gap-2">
          {(exp ?? []).slice(0, 10).map((e) => (
            <View key={e.id} className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-dime-orange-50">
                <Icon name="shippingbox.fill" size={14} color="#FC8019" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-dime-ink">{e.description ?? e.category}</Text>
                <Text className="text-[11px] text-dime-ink-3">{shortDate(e.date)} • {e.category}</Text>
              </View>
              <Text className="text-[14px] font-semibold text-dime-ink">{rupees(e.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
