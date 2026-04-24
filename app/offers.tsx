import { Text, View } from "react-native";
import { Header, Icon, Screen } from "@/components/ui";
import { useActiveOffers } from "@/hooks/queries";
import { rupees, shortDate } from "@/lib/format";

export default function Offers() {
  const { data } = useActiveOffers();
  return (
    <Screen>
      <Header title="Offers" back />
      <View className="px-4 gap-3">
        {(data ?? []).map((o) => (
          <View key={o.id} className="rounded-2xl border border-dashed border-dime-orange-300 bg-dime-orange-50 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-dime-orange-700">{o.promo_code ?? "PROMO"}</Text>
              <View className="rounded-full bg-dime-orange-500 px-2.5 py-1">
                <Text className="text-[11px] font-bold text-white">
                  {o.discount_type === "percentage" ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}
                </Text>
              </View>
            </View>
            <Text className="mt-1 text-[16px] font-semibold text-dime-ink">{o.title}</Text>
            {o.description ? <Text className="mt-1 text-[13px] text-dime-ink-2">{o.description}</Text> : null}
            <View className="mt-2 flex-row items-center gap-2">
              <Icon name="clock.fill" size={12} color="#8E8E93" />
              <Text className="text-[11px] text-dime-ink-3">Valid till {shortDate(o.valid_to)}</Text>
              <Text className="text-[11px] text-dime-ink-3">• Min {rupees(o.min_order_amount)}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
