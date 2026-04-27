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

      <View className="mx-5 flex-row gap-4">
        <View className="flex-1 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>This month</Text>
          <Text className="mt-1 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{rupees(monthExpense)}</Text>
          <Text className="text-[11px] text-dime-ink-3">{(exp ?? []).length} entries total</Text>
        </View>
        <View className="flex-1 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>All-time</Text>
          <Text className="mt-1 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{rupees(totalExpense)}</Text>
        </View>
      </View>

      <View className="mx-5 mt-5">
        <Text className="mb-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Stock levels</Text>
        <View className="rounded-2xl overflow-hidden bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
          {(inv ?? []).map((i, idx) => {
            const status = i.quantity <= 0 ? "out" : i.quantity <= i.min_threshold ? "low" : "ok";
            return (
              <View key={i.id} className={`flex-row items-center justify-between p-4 ${idx > 0 ? "border-t border-neutral-50" : ""}`}>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-dime-ink">{i.name}</Text>
                  <Text className="text-[12px] text-dime-ink-3">{i.quantity} {i.unit} • {i.supplier_name ?? "—"}</Text>
                </View>
                <Badge tone={status === "out" ? "red" : status === "low" ? "orange" : "green"} label={status === "out" ? "Out" : status === "low" ? "Low" : "OK"} />
              </View>
            );
          })}
        </View>
      </View>

      <View className="mx-5 mt-5">
        <Text className="mb-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Recent expenses</Text>
        <View className="gap-2">
          {(exp ?? []).slice(0, 10).map((e) => (
            <View key={e.id} className="flex-row items-center gap-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-dime-primary-50">
                <Icon name="shippingbox.fill" size={14} color="#FF6B2C" />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-dime-ink">{e.description ?? e.category}</Text>
                <Text className="text-[11px] text-dime-ink-3">{shortDate(e.date)} • {e.category}</Text>
              </View>
              <Text className="text-[14px] font-bold text-dime-ink">{rupees(e.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
