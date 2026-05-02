import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
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
        <View className="h-2 bg-[#F2F2F2]" />
        <View className="flex-1 items-center justify-center bg-white p-8">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-[#F2F2F2]">
            <Icon name="cart.fill" size={32} color="#D4D4D8" />
          </View>
          <Text className="text-[18px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.3 }}>
            Your cart is empty
          </Text>
          <Text className="mt-1 text-center text-[14px] text-[#93959F]">Add items from a menu to get started.</Text>
          <View className="mt-6">
            <Button label="Discover restaurants" onPress={() => router.replace("/discover")} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={cart.session?.restaurantName ?? "Your cart"} subtitle={`${cart.items.length} items`} back />

      <View className="h-2 bg-[#F2F2F2]" />

      {/* Cart items */}
      <View className="bg-white">
        {cart.items.map((item, idx) => {
          const addonSum = item.addons.reduce((s, a) => s + (a.price || 0), 0);
          const line = (item.unitPrice + addonSum) * item.quantity;
          return (
            <View
              key={item.cartId}
              className="px-4 py-3.5"
              style={idx > 0 ? { borderTopWidth: 1, borderTopColor: "#F0F0F0" } : undefined}
            >
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[15px] font-bold text-[#1C1C1E]">{item.name}</Text>
                  {item.variant ? <Text className="text-[12px] text-[#93959F]">{item.variant}</Text> : null}
                  {item.instructions ? <Text className="text-[12px] italic text-[#93959F]">"{item.instructions}"</Text> : null}
                  <Text className="mt-0.5 text-[14px] font-semibold text-[#535665]">{rupees(line)}</Text>
                </View>
                <Stepper value={item.quantity} onChange={(v) => cart.updateQuantity(item.cartId, v)} size="sm" min={0} />
              </View>
            </View>
          );
        })}
      </View>

      <View className="h-2 bg-[#F2F2F2]" />

      {/* Table number */}
      <View className="bg-white px-4 py-4">
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
        <>
          <View className="h-2 bg-[#F2F2F2]" />
          <View className="bg-white px-4 py-4">
            <Text className="mb-3 text-[14px] font-bold text-[#1C1C1E]" style={{ letterSpacing: -0.2 }}>Apply a code</Text>
            <View className="gap-2">
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
                    className="flex-row items-center justify-between rounded-[12px] bg-white p-3.5"
                    style={[
                      { borderWidth: 1, borderColor: selected ? "#E23744" : "#F0F0F0" },
                      !applicable && { opacity: 0.4 },
                    ]}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Icon name="tag.fill" size={11} color="#E23744" />
                        <Text className="text-[10px] font-bold uppercase text-[#E23744]" style={{ letterSpacing: 1 }}>
                          {o.promo_code}
                        </Text>
                      </View>
                      <Text className="mt-1 text-[14px] font-bold text-[#1C1C1E]">{o.title}</Text>
                      <Text className="mt-0.5 text-[12px] text-[#93959F]">Save {rupees(discount)} · Min {rupees(o.min_order_amount)}</Text>
                    </View>
                    <Text className={`text-[13px] font-bold ${selected ? "text-[#E23744]" : "text-[#93959F]"}`}>
                      {selected ? "Applied" : "Apply"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : null}

      {/* Points */}
      {profile && profile.loyalty_points >= 100 ? (
        <>
          <View className="h-2 bg-[#F2F2F2]" />
          <View className="flex-row items-center justify-between bg-white px-4 py-4">
            <View>
              <Text className="text-[14px] font-bold text-[#1C1C1E]">Redeem points</Text>
              <Text className="mt-0.5 text-[12px] text-[#93959F]">{profile.loyalty_points} available · 100 points = ₹50</Text>
            </View>
            <Chip
              label={cart.pointsToRedeem > 0 ? `${cart.pointsToRedeem} redeemed` : "Use 100"}
              selected={cart.pointsToRedeem > 0}
              onPress={() => cart.setPoints(cart.pointsToRedeem > 0 ? 0 : Math.min(100, profile.loyalty_points))}
            />
          </View>
        </>
      ) : null}

      <View className="h-2 bg-[#F2F2F2]" />

      {/* Tip */}
      <View className="bg-white px-4 py-4">
        <Text className="mb-3 text-[11px] font-bold uppercase text-[#93959F]" style={{ letterSpacing: 1 }}>Add a tip</Text>
        <View className="flex-row gap-2">
          {tips.map((t) => (
            <Chip key={t} label={t === 0 ? "No tip" : rupees(t)} selected={cart.tipAmount === t} onPress={() => cart.setTip(t)} />
          ))}
        </View>
      </View>

      <View className="h-2 bg-[#F2F2F2]" />

      {/* Instructions */}
      <View className="bg-white px-4 py-4">
        <Input
          label="Special instructions"
          placeholder="Allergies, preferences..."
          value={cart.specialInstructions}
          onChangeText={cart.setSpecialInstructions}
          multiline
          numberOfLines={3}
        />
      </View>

      <View className="h-2 bg-[#F2F2F2]" />

      {/* Bill summary */}
      <View className="bg-white px-4 py-4">
        <Text className="mb-3 text-[11px] font-bold uppercase text-[#93959F]" style={{ letterSpacing: 1 }}>Bill summary</Text>
        <Row label="Subtotal" value={rupees(subtotal)} />
        {cart.discountAmount > 0 && <Row label="Discount" value={`- ${rupees(cart.discountAmount)}`} positive />}
        {cart.pointsToRedeem > 0 && <Row label="Points" value={`- ${rupees(pointsValue)}`} positive />}
        <Row label="GST (5%)" value={rupees(tax)} />
        {cart.tipAmount > 0 && <Row label="Tip" value={rupees(cart.tipAmount)} />}
        <View className="mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: "#F0F0F0" }}>
          <Row label="Total" value={rupees(grandTotal)} bold />
        </View>
      </View>

      <View className="px-4 pb-8 pt-4">
        <Button label={`Place order · ${rupees(grandTotal)}`} size="lg" loading={placing} onPress={placeOrder} fullWidth />
      </View>
    </Screen>
  );
}

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className={bold ? "text-[16px] font-bold text-[#1C1C1E]" : "text-[14px] text-[#535665]"}>{label}</Text>
      <Text className={`${bold ? "text-[17px] font-bold" : "text-[14px] font-medium"} ${positive ? "text-[#267E3E]" : "text-[#1C1C1E]"}`}>{value}</Text>
    </View>
  );
}
