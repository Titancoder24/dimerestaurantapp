import { Text, View } from "react-native";
import { Header, Icon, Screen } from "@/components/ui";
import { useActiveOffers } from "@/hooks/queries";
import { rupees, shortDate } from "@/lib/format";

export default function Offers() {
  const { data } = useActiveOffers();
  return (
    <Screen>
      <Header title="Offers" back />
      <View className="px-5 gap-4">
        {(data ?? []).map((o) => (
          <View
            key={o.id}
            className="rounded-2xl bg-dime-primary-50 p-5"
            style={{ borderWidth: 1, borderColor: "rgba(255,107,44,0.15)", borderStyle: "dashed" }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-bold uppercase text-dime-primary-600" style={{ letterSpacing: 1.5 }}>
                {o.promo_code ?? "PROMO"}
              </Text>
              <View className="rounded-full bg-dime-primary-500 px-3 py-1.5">
                <Text className="text-[11px] font-bold text-white">
                  {o.discount_type === "percentage" ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}
                </Text>
              </View>
            </View>
            <Text className="mt-2 text-[17px] font-bold text-dime-ink" style={{ letterSpacing: -0.3 }}>
              {o.title}
            </Text>
            {o.description ? <Text className="mt-1 text-[14px] text-dime-ink-2">{o.description}</Text> : null}
            <View className="mt-3 flex-row items-center gap-2">
              <Icon name="clock.fill" size={12} color="#8A8A8A" />
              <Text className="text-[12px] text-dime-ink-3">Valid till {shortDate(o.valid_to)}</Text>
              <Text className="text-[12px] text-dime-ink-3">· Min {rupees(o.min_order_amount)}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
