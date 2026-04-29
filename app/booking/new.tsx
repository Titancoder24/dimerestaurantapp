import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Chip, Header, Icon, Input, Screen, Stepper, VegDot, haptic } from "@/components/ui";
import { useRestaurant, useMenu } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { rupees } from "@/lib/format";
import type { Tables } from "@/lib/supabase";
import dayjs from "dayjs";

const timeSlots = {
  lunch: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"],
  dinner: ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
};
const seatingOptions: ("any" | "indoor" | "outdoor" | "rooftop" | "private" | "bar")[] = [
  "any", "indoor", "outdoor", "rooftop", "private", "bar",
];
const occasions = ["Birthday", "Anniversary", "Date Night", "Business", "Family", "Other"];

type PreOrderItem = { menuItemId: string; name: string; price: number; quantity: number; isVeg: boolean; image?: string };

export default function NewBooking() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const router = useRouter();
  const { data: restaurant } = useRestaurant(restaurantId);
  const { data: menu } = useMenu(restaurantId);
  const profile = useAuth((s) => s.profile);
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [seating, setSeating] = useState<(typeof seatingOptions)[number]>("any");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [preOrder, setPreOrder] = useState<PreOrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  const days = Array.from({ length: 14 }).map((_, i) => dayjs().add(i, "day"));

  const preOrderTotal = preOrder.reduce((s, i) => s + i.price * i.quantity, 0);

  function addToPreOrder(item: Tables<"menu_items">) {
    const existing = preOrder.find((p) => p.menuItemId === item.id);
    if (existing) {
      setPreOrder(preOrder.map((p) => p.menuItemId === item.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setPreOrder([...preOrder, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1, isVeg: item.is_veg, image: item.images[0] }]);
    }
    haptic.light();
  }

  function updatePreOrderQty(menuItemId: string, qty: number) {
    if (qty <= 0) {
      setPreOrder(preOrder.filter((p) => p.menuItemId !== menuItemId));
    } else {
      setPreOrder(preOrder.map((p) => p.menuItemId === menuItemId ? { ...p, quantity: qty } : p));
    }
  }

  async function submit() {
    if (!restaurantId || !profile || !time) {
      toast.error(time ? "Missing details" : "Pick a time");
      return;
    }
    setSaving(true);
    try {
      const preOrderData = preOrder.length > 0
        ? preOrder.map((p) => ({ menu_item_id: p.menuItemId, name: p.name, price: p.price, quantity: p.quantity }))
        : null;

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: profile.id,
          restaurant_id: restaurantId,
          date: dayjs().add(dayOffset, "day").format("YYYY-MM-DD"),
          time: `${time}:00`,
          guests,
          seating_preference: seating,
          occasion,
          special_requests: notes || null,
          pre_order: preOrderData,
          status: "pending",
          source: "app",
        })
        .select()
        .single();
      if (error) throw error;
      haptic.success();
      router.replace({ pathname: "/booking-confirm/[id]", params: { id: data.id } });
    } catch (e) {
      haptic.error();
      toast.error("Could not book", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (step === 0) {
    return (
      <Screen>
        <Header title="Book a table" subtitle={restaurant?.name} back />

        <View className="px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Pick a date
          </Text>
          <FlatList
            horizontal
            data={days}
            keyExtractor={(d) => d.format("YYYY-MM-DD")}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item, index }) => {
              const selected = dayOffset === index;
              return (
                <Pressable
                  onPress={() => { haptic.select(); setDayOffset(index); }}
                  className={`w-[66px] items-center rounded-2xl py-3 ${selected ? "bg-dime-ink" : "bg-dime-bg-2"}`}
                >
                  <Text className={`text-[10px] font-bold uppercase ${selected ? "text-white/60" : "text-dime-ink-4"}`} style={{ letterSpacing: 1 }}>
                    {item.format("ddd")}
                  </Text>
                  <Text className={`text-[20px] font-bold ${selected ? "text-white" : "text-dime-ink"}`} style={{ letterSpacing: -0.5 }}>
                    {item.format("DD")}
                  </Text>
                  <Text className={`text-[10px] ${selected ? "text-white/60" : "text-dime-ink-4"}`}>{item.format("MMM")}</Text>
                </Pressable>
              );
            }}
          />
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Lunch</Text>
          <View className="flex-row flex-wrap gap-2">
            {timeSlots.lunch.map((t) => (
              <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
            ))}
          </View>
          <Text className="mb-3 mt-5 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Dinner</Text>
          <View className="flex-row flex-wrap gap-2">
            {timeSlots.dinner.map((t) => (
              <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
            ))}
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Guests</Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
            <Text className="text-[16px] font-semibold text-dime-ink">{guests} {guests === 1 ? "guest" : "guests"}</Text>
            <Stepper value={guests} onChange={setGuests} min={1} max={20} />
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Seating preference</Text>
          <View className="flex-row flex-wrap gap-2">
            {seatingOptions.map((s) => (
              <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} selected={seating === s} onPress={() => setSeating(s)} />
            ))}
          </View>
        </View>

        <View className="mt-6 px-5">
          <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Occasion</Text>
          <View className="flex-row flex-wrap gap-2">
            {occasions.map((o) => (
              <Chip key={o} label={o} selected={occasion === o} onPress={() => setOccasion(occasion === o ? null : o)} />
            ))}
          </View>
        </View>

        <View className="mt-6 px-5">
          <Input label="Special requests" placeholder="Any preferences..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        </View>

        <View className="mx-5 mt-8 mb-8">
          <Button
            label="Next — Pre-order food"
            size="lg"
            trailing={<Icon name="chevron.right" size={16} color="#fff" />}
            onPress={() => {
              if (!time) { toast.error("Pick a time slot"); return; }
              setStep(1);
            }}
            fullWidth
          />
          <Pressable onPress={() => { if (!time) { toast.error("Pick a time slot"); return; } submit(); }} className="mt-3 items-center py-3">
            <Text className="text-[14px] font-semibold text-dime-ink-3">Skip pre-order & book now</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return <PreOrderStep
    menu={menu}
    restaurant={restaurant}
    preOrder={preOrder}
    preOrderTotal={preOrderTotal}
    onAdd={addToPreOrder}
    onUpdateQty={updatePreOrderQty}
    onBack={() => setStep(0)}
    onSubmit={submit}
    saving={saving}
  />;
}

function PreOrderStep({
  menu,
  restaurant,
  preOrder,
  preOrderTotal,
  onAdd,
  onUpdateQty,
  onBack,
  onSubmit,
  saving,
}: {
  menu: { categories: Tables<"menu_categories">[]; items: Tables<"menu_items">[] } | undefined;
  restaurant: any;
  preOrder: PreOrderItem[];
  preOrderTotal: number;
  onAdd: (item: Tables<"menu_items">) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!menu) return [];
    return menu.items.filter((i) => {
      if (!i.is_available) return false;
      if (activeCategory && i.category_id !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [menu, activeCategory, search]);

  return (
    <Screen scroll={false}>
      <Header title="Pre-order food" subtitle={restaurant?.name} />

      <View className="px-5">
        <Input
          placeholder="Search dishes..."
          value={search}
          onChangeText={setSearch}
          leading={<Icon name="magnifyingglass" size={16} color="#8A8A8A" />}
        />
        <View className="mt-3">
          <FlatList
            horizontal
            data={[null, ...(menu?.categories ?? [])]}
            keyExtractor={(c) => c?.id ?? "all"}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Chip label={item?.name ?? "All"} selected={activeCategory === (item?.id ?? null)} onPress={() => setActiveCategory(item?.id ?? null)} />
            )}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 200 }}
        renderItem={({ item }) => {
          const inCart = preOrder.find((p) => p.menuItemId === item.id);
          return (
            <View className="flex-row items-center gap-3 rounded-2xl bg-white p-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
              {item.images[0] ? (
                <Image source={{ uri: item.images[0] }} className="h-16 w-16 rounded-xl" resizeMode="cover" />
              ) : (
                <View className="h-16 w-16 items-center justify-center rounded-xl bg-dime-bg-2">
                  <Icon name="fork.knife" size={18} color="#BFBFBF" />
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <VegDot veg={item.is_veg} />
                  <Text numberOfLines={1} className="flex-1 text-[14px] font-bold text-dime-ink">{item.name}</Text>
                </View>
                {item.description ? <Text numberOfLines={1} className="mt-0.5 text-[12px] text-dime-ink-3">{item.description}</Text> : null}
                <Text className="mt-0.5 text-[14px] font-semibold text-dime-ink-2">{rupees(item.price)}</Text>
              </View>
              {inCart ? (
                <Stepper value={inCart.quantity} onChange={(q) => onUpdateQty(item.id, q)} min={0} size="sm" />
              ) : (
                <Pressable
                  onPress={() => onAdd(item)}
                  className="rounded-xl border border-dime-primary-300 bg-dime-primary-50 px-4 py-2"
                >
                  <Text className="text-[13px] font-bold text-dime-primary-600">ADD</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="fork.knife" size={32} color="#BFBFBF" />
            <Text className="mt-3 text-[15px] font-bold text-dime-ink">No items yet</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-3">This restaurant hasn't added menu items yet.</Text>
          </View>
        }
      />

      {preOrder.length > 0 ? (
        <View className="absolute inset-x-0 bottom-20 mx-5 rounded-2xl bg-dime-ink p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }}>
          <View className="flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
              <Text className="text-[13px] font-bold text-dime-ink">{preOrder.reduce((s, i) => s + i.quantity, 0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-white">{preOrder.length} dish{preOrder.length > 1 ? "es" : ""} pre-ordered</Text>
              <Text className="text-[12px] text-white/60">{rupees(preOrderTotal)} estimated</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View className="absolute inset-x-0 bottom-0 flex-row gap-3 bg-white px-5 pb-8 pt-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 }}>
        <Pressable onPress={onBack} className="h-12 w-12 items-center justify-center rounded-2xl bg-dime-bg-2">
          <Icon name="chevron.left" size={18} color="#1C1C1E" />
        </Pressable>
        <View className="flex-1">
          <Button
            label={preOrder.length > 0 ? `Book with pre-order · ${rupees(preOrderTotal)}` : "Book without pre-order"}
            loading={saving}
            onPress={onSubmit}
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}
