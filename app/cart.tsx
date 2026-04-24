import { useState } from "react";
import { Pressable, Text, TextInput, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Button, Chip, Header, Icon, Input, Screen, Stepper, haptic } from "@/components/ui";
import { useCart } from "@/store/cart";
import { useActiveOffers } from "@/hooks/queries";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { supabase } from "@/lib/supabase";
import { rupees } from "@/lib/format";

const tips = [0, 50, 100, 200];

export default function Cart() {
  const router = useRouter();
  const cart = useCart();
  const { data: offers } = useActiveOffers(cart.session?.restaurantId);
  const profile = useAuth((s) => s.profile);
  const toast = useToast();

  const [tableNumber, setTableNumber] = useState(cart.session?.tableNumber ?? 0);
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.subtotal();
  // Tax rate is per-restaurant; we fetch from the cart session for UI. Final is recomputed server-side.
  const pointsValue = cart.pointsToRedeem * 0.5;
  const taxable = Math.max(0, subtotal - cart.discountAmount);
  const tax = Math.round(taxable * 0.05 * 100) / 100;
  const grandTotal = Math.max(0, subtotal - cart.discountAmount - pointsValue) + tax + cart.tipAmount;

  async function placeOrder() {
    if (!cart.session) return toast.error("No active session");
    if (cart.items.length === 0) return toast.error("Cart is empty");
    if (!profile) return toast.error("Please sign in first");

    setPlacing(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          restaurant_id: cart.session.restaurantId,
          user_id: profile.id,
          type: cart.session.tableId ? "dine_in" : "takeaway",
          table_id: cart.session.tableId ?? null,
          subtotal,
          discount_amount: cart.discountAmount,
          tax_amount: tax,
          service_charge_amount: 0,
          tip_amount: cart.tipAmount,
          total_amount: grandTotal,
          promo_code: cart.promoCode,
          points_redeemed: cart.pointsToRedeem,
          status: "received",
          customer_notes: cart.specialInstructions,
        })
        .select()
        .single();

      if (error) throw error;

      const rows = cart.items.map((i) => {
        const addonSum = i.addons.reduce((s, a) => s + (a.price || 0), 0);
        const line = (i.unitPrice + addonSum) * i.quantity;
        return {
          order_id: order.id,
          menu_item_id: i.menuItemId,
          name: i.name,
          unit_price: i.unitPrice,
          quantity: i.quantity,
          variant: i.variant ?? null,
          addons: i.addons,
          removed_ingredients: i.removed,
          special_instructions: i.instructions ?? null,
          line_total: line,
          status: "pending" as const,
        };
      });
      const { error: itemsErr } = await supabase.from("order_items").insert(rows);
      if (itemsErr) throw itemsErr;

      if (cart.pointsToRedeem > 0) {
        await supabase.from("loyalty_transactions").insert({
          user_id: profile.id,
          type: "redeemed",
          points: -cart.pointsToRedeem,
          reference_id: order.id,
          description: `Redeemed at ${cart.session.restaurantName}`,
        });
      }

      cart.clearCart();
      haptic.success();
      toast.success("Order placed!", `Order ${order.order_number}`);
      router.replace({ pathname: "/order/[id]", params: { id: order.id } });
    } catch (e) {
      haptic.error();
      toast.error("Could not place order", (e as Error).message);
    } finally {
      setPlacing(false);
    }
  }

  function applyPromo(code: string, discount: number) {
    cart.applyPromo(code, discount);
    haptic.success();
    toast.success("Promo applied", `You save ${rupees(discount)}`);
  }

  if (cart.items.length === 0) {
    return (
      <Screen scroll={false}>
        <Header title="Your Cart" back />
        <View className="flex-1 items-center justify-center p-8">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-dime-orange-50">
            <Icon name="cart.fill" size={34} color="#FC8019" />
          </View>
          <Text className="text-[18px] font-semibold text-dime-ink">Your cart is empty</Text>
          <Text className="mt-1 text-center text-[13px] text-dime-ink-3">Add items from a menu to get started.</Text>
          <View className="mt-5">
            <Button label="Discover restaurants" onPress={() => router.replace("/discover")} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={cart.session?.restaurantName ?? "Your cart"} subtitle={`${cart.items.length} items`} back />

      <View className="mx-4 rounded-2xl border border-dime-border bg-white">
        {cart.items.map((item, idx) => {
          const addonSum = item.addons.reduce((s, a) => s + (a.price || 0), 0);
          const line = (item.unitPrice + addonSum) * item.quantity;
          return (
            <View key={item.cartId} className={`p-3 ${idx > 0 ? "border-t border-dime-border" : ""}`}>
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[15px] font-semibold text-dime-ink">{item.name}</Text>
                  {item.variant ? <Text className="text-[12px] text-dime-ink-3">{item.variant}</Text> : null}
                  {item.instructions ? <Text className="text-[12px] italic text-dime-ink-3">"{item.instructions}"</Text> : null}
                  <Text className="mt-1 text-[13px] font-semibold text-dime-ink-2">{rupees(line)}</Text>
                </View>
                <Stepper value={item.quantity} onChange={(v) => cart.updateQuantity(item.cartId, v)} size="sm" min={0} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Table number */}
      <View className="mx-4 mt-4">
        <Input
          label="Table number"
          keyboardType="number-pad"
          value={tableNumber ? String(tableNumber) : ""}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            setTableNumber(Number.isFinite(n) ? n : 0);
            if (cart.session) cart.startSession({ ...cart.session, tableNumber: Number.isFinite(n) ? n : undefined });
          }}
          placeholder="e.g. 5"
        />
      </View>

      {/* Offers */}
      {offers && offers.length > 0 ? (
        <View className="mx-4 mt-4 rounded-2xl border border-dashed border-dime-orange-300 bg-dime-orange-50 p-3">
          <Text className="text-[13px] font-semibold text-dime-ink">Apply a code</Text>
          <View className="mt-2 gap-2">
            {offers.map((o) => {
              const applicable = subtotal >= o.min_order_amount;
              const discount = o.discount_type === "percentage"
                ? Math.min(o.max_discount_cap ?? Infinity, Math.round(subtotal * Number(o.discount_value) / 100))
                : Number(o.discount_value);
              const selected = cart.promoCode === o.promo_code;
              return (
                <Pressable
                  key={o.id}
                  disabled={!applicable}
                  onPress={() => selected ? cart.applyPromo(null, 0) : applyPromo(o.promo_code ?? "", discount)}
                  className={`flex-row items-center justify-between rounded-xl border p-3 ${selected ? "border-dime-orange-500 bg-white" : "border-dime-orange-200 bg-white"} ${!applicable && "opacity-40"}`}
                >
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold uppercase tracking-widest text-dime-orange-700">{o.promo_code}</Text>
                    <Text className="text-[13px] font-semibold text-dime-ink">{o.title}</Text>
                    <Text className="text-[11px] text-dime-ink-3">Save {rupees(discount)} • Min {rupees(o.min_order_amount)}</Text>
                  </View>
                  <Text className={`text-[12px] font-semibold ${selected ? "text-dime-orange-600" : "text-dime-ink-3"}`}>
                    {selected ? "Applied" : "Apply"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Loyalty */}
      {profile && profile.loyalty_points >= 100 ? (
        <View className="mx-4 mt-4 rounded-2xl border border-dime-border bg-white p-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[13px] font-semibold text-dime-ink">Redeem points</Text>
              <Text className="text-[11px] text-dime-ink-3">{profile.loyalty_points} available • 100 points = ₹50</Text>
            </View>
            <Chip
              label={cart.pointsToRedeem > 0 ? `${cart.pointsToRedeem} redeemed` : "Use 100"}
              selected={cart.pointsToRedeem > 0}
              onPress={() => cart.setPoints(cart.pointsToRedeem > 0 ? 0 : Math.min(100, profile.loyalty_points))}
            />
          </View>
        </View>
      ) : null}

      {/* Tip */}
      <View className="mx-4 mt-4">
        <Text className="mb-2 text-[13px] font-semibold text-dime-ink">Add a tip</Text>
        <View className="flex-row gap-2">
          {tips.map((t) => (
            <Chip key={t} label={t === 0 ? "No tip" : rupees(t)} selected={cart.tipAmount === t} onPress={() => cart.setTip(t)} />
          ))}
        </View>
      </View>

      {/* Special instructions */}
      <View className="mx-4 mt-4">
        <Input
          label="Special instructions (optional)"
          placeholder="Allergies, preferences..."
          value={cart.specialInstructions}
          onChangeText={cart.setSpecialInstructions}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Bill summary */}
      <View className="mx-4 mt-4 rounded-2xl bg-white border border-dime-border p-4">
        <Row label="Subtotal" value={rupees(subtotal)} />
        {cart.discountAmount > 0 && <Row label="Discount" value={`- ${rupees(cart.discountAmount)}`} positive />}
        {cart.pointsToRedeem > 0 && <Row label="Points" value={`- ${rupees(pointsValue)}`} positive />}
        <Row label="GST (5%)" value={rupees(tax)} />
        {cart.tipAmount > 0 && <Row label="Tip" value={rupees(cart.tipAmount)} />}
        <View className="mt-2 border-t border-dime-border pt-2">
          <Row label="Total" value={rupees(grandTotal)} bold />
        </View>
      </View>

      <View className="mx-4 mt-5">
        <Button label={`Place order • ${rupees(grandTotal)}`} size="lg" loading={placing} onPress={placeOrder} fullWidth />
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
