import { Text, View, Switch, Pressable } from "react-native";
import { Badge, Header, Icon, Screen } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useActiveOffers } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { rupees, shortDate } from "@/lib/format";

export default function OwnerOffers() {
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();
  const { data: offers } = useActiveOffers(restaurant?.id);

  async function toggle(id: string, current: boolean) {
    await supabase.from("offers").update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["offers"] });
  }

  return (
    <Screen>
      <Header title="Offers" subtitle={`${offers?.length ?? 0} campaigns`} />
      <View className="mx-5 gap-4">
        {(offers ?? []).map((o) => (
          <View key={o.id} className="rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold uppercase text-dime-primary-700" style={{ letterSpacing: 1.5 }}>{o.promo_code ?? "PROMO"}</Text>
              <Switch value={o.is_active} onValueChange={() => toggle(o.id, o.is_active)} trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }} />
            </View>
            <Text className="mt-1 text-[16px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{o.title}</Text>
            <Text className="text-[12px] text-dime-ink-2">{o.description}</Text>
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <Badge tone="orange" label={o.discount_type === "percentage" ? `${o.discount_value}%` : rupees(o.discount_value)} />
              <Badge tone="gray" label={`Min ${rupees(o.min_order_amount)}`} />
              <Badge tone="gray" label={`Ends ${shortDate(o.valid_to)}`} />
              <Badge tone="gold" label={`${o.used_count} used`} />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
