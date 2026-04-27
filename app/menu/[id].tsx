import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Chip, Header, Icon, Input, Screen, Sheet, Stepper, VegDot, haptic } from "@/components/ui";
import { useMenu, useRestaurant } from "@/hooks/queries";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/cn";
import { rupees } from "@/lib/format";
import type { Tables } from "@/lib/supabase";

export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: restaurant } = useRestaurant(id);
  const { data: menu } = useMenu(id);
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [detail, setDetail] = useState<Tables<"menu_items"> | null>(null);

  const session = useCart((s) => s.session);
  const cartCount = useCart((s) => s.count());
  const cartSubtotal = useCart((s) => s.subtotal());
  const addItem = useCart((s) => s.addItem);
  const startSession = useCart((s) => s.startSession);

  const byCategory = useMemo(() => {
    if (!menu) return [];
    return menu.categories.map((c) => ({
      category: c,
      items: menu.items.filter((i) => {
        if (i.category_id !== c.id) return false;
        if (!i.is_available) return false;
        if (vegOnly && !i.is_veg) return false;
        if (nonVegOnly && i.is_veg) return false;
        if (search) {
          const q = search.toLowerCase();
          return i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q);
        }
        return true;
      }),
    })).filter((g) => g.items.length > 0);
  }, [menu, vegOnly, nonVegOnly, search]);

  const onAdd = (item: Tables<"menu_items">) => {
    if (!session && restaurant) {
      startSession({ restaurantId: restaurant.id, restaurantName: restaurant.name });
    }
    haptic.light();
    addItem({
      menuItemId: item.id,
      name: item.name,
      unitPrice: Number(item.price),
      quantity: 1,
      addons: [],
      removed: [],
      image: item.images[0],
      isVeg: item.is_veg,
    });
  };

  return (
    <Screen scroll={false}>
      <Header title={restaurant?.name ?? "Menu"} subtitle={session ? `Dine-in at Table ${session.tableNumber ?? "—"}` : "Browsing mode"} back />

      <View className="px-5">
        <Input
          placeholder="Search dishes..."
          value={search}
          onChangeText={setSearch}
          leading={<Icon name="magnifyingglass" size={16} color="#8A8A8A" />}
        />
        <View className="mt-3 flex-row gap-2">
          <Chip label="Veg" selected={vegOnly} onPress={() => { setVegOnly(!vegOnly); setNonVegOnly(false); }} leading={<VegDot veg={true} />} />
          <Chip label="Non-Veg" selected={nonVegOnly} onPress={() => { setNonVegOnly(!nonVegOnly); setVegOnly(false); }} leading={<VegDot veg={false} />} />
        </View>
      </View>

      <FlatList
        data={byCategory}
        keyExtractor={(g) => g.category.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 24 }}
        renderItem={({ item: group }) => (
          <View>
            <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
              {group.category.name} <Text className="normal-case text-dime-ink-4">({group.items.length})</Text>
            </Text>
            <View className="gap-3">
              {group.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  onAdd={onAdd}
                  onDetails={() => setDetail(item)}
                />
              ))}
            </View>
          </View>
        )}
      />

      {cartCount > 0 ? (
        <Pressable
          onPress={() => router.push("/cart")}
          className="absolute inset-x-5 bottom-8 flex-row items-center gap-3 rounded-[22px] bg-dime-ink px-6 py-4"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20 }}
        >
          <View className="h-7 w-7 items-center justify-center rounded-full bg-white">
            <Text className="text-[13px] font-bold text-dime-ink">{cartCount}</Text>
          </View>
          <Text className="flex-1 text-[15px] font-bold text-white">
            {cartCount} item{cartCount > 1 ? "s" : ""} · {rupees(cartSubtotal)}
          </Text>
          <Text className="text-[14px] font-semibold text-white/70">View cart</Text>
          <Icon name="chevron.right" size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>
      ) : null}

      <ItemDetailSheet item={detail} onClose={() => setDetail(null)} onAdd={(item) => { onAdd(item); setDetail(null); }} />
    </Screen>
  );
}

function MenuItemRow({
  item,
  onAdd,
  onDetails,
}: {
  item: Tables<"menu_items">;
  onAdd: (i: Tables<"menu_items">) => void;
  onDetails: () => void;
}) {
  return (
    <Pressable
      onPress={onDetails}
      className="flex-row items-start gap-4 rounded-2xl bg-white p-4"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <VegDot veg={item.is_veg} />
          {item.is_bestseller ? <Badge tone="gold" label="Bestseller" /> : null}
          {item.spice_level > 0 ? (
            <View className="flex-row">
              {Array.from({ length: item.spice_level }).map((_, i) => (
                <Icon key={i} name="flame.fill" size={11} color="#EF4444" />
              ))}
            </View>
          ) : null}
        </View>
        <Text className="mt-1.5 text-[16px] font-bold text-dime-ink" style={{ letterSpacing: -0.2 }}>
          {item.name}
        </Text>
        <Text className="mt-0.5 text-[14px] font-semibold text-dime-ink-2">{rupees(item.price)}</Text>
        {item.description ? (
          <Text numberOfLines={2} className="mt-1.5 text-[13px] leading-[18px] text-dime-ink-3">{item.description}</Text>
        ) : null}
      </View>

      <View className="relative">
        <Image source={{ uri: item.images[0] ?? "" }} className="h-[100px] w-[100px] rounded-xl" resizeMode="cover" />
        <Pressable
          onPress={(e) => { e.stopPropagation(); onAdd(item); }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-white px-5 py-2"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
        >
          <Text className="text-[13px] font-bold text-dime-primary-500">ADD</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function ItemDetailSheet({
  item,
  onClose,
  onAdd,
}: {
  item: Tables<"menu_items"> | null;
  onClose: () => void;
  onAdd: (i: Tables<"menu_items">) => void;
}) {
  const [qty, setQty] = useState(1);
  if (!item) return null;

  return (
    <Sheet visible={!!item} onClose={onClose} maxHeight="85%">
      <Sheet.Body>
        <Image source={{ uri: item.images[0] ?? "" }} className="-mx-6 h-52" resizeMode="cover" />
        <View className="mt-5 flex-row items-center gap-2">
          <VegDot veg={item.is_veg} />
          {item.is_bestseller ? <Badge tone="gold" label="Bestseller" /> : null}
        </View>
        <Text className="mt-2 text-[24px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{item.name}</Text>
        <Text className="mt-0.5 text-[18px] font-bold text-dime-ink-2">{rupees(item.price)}</Text>
        {item.description ? <Text className="mt-3 text-[15px] leading-[22px] text-dime-ink-2">{item.description}</Text> : null}

        <View className="mt-5 flex-row gap-3">
          {item.calories ? (
            <View className="rounded-full bg-dime-bg-2 px-4 py-2">
              <Text className="text-[13px] font-medium text-dime-ink-2">{item.calories} cal</Text>
            </View>
          ) : null}
          <View className="rounded-full bg-dime-bg-2 px-4 py-2">
            <Text className="text-[13px] font-medium text-dime-ink-2">{item.prep_time_minutes} min</Text>
          </View>
        </View>

        {item.allergens.length > 0 ? (
          <View className="mt-5 rounded-2xl bg-amber-50 p-4">
            <Text className="text-[10px] font-bold uppercase text-amber-800" style={{ letterSpacing: 1.5 }}>Allergens</Text>
            <Text className="mt-1 text-[14px] text-amber-900">{item.allergens.join(", ")}</Text>
          </View>
        ) : null}

        <View className="mt-8 flex-row items-center justify-between">
          <Stepper value={qty} onChange={setQty} />
          <Button
            label={`Add ${qty} to cart · ${rupees(Number(item.price) * qty)}`}
            onPress={() => {
              for (let i = 0; i < qty; i++) onAdd(item);
            }}
          />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}
