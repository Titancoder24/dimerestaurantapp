import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Switch, Text, View } from "react-native";
import { actionSheet, confirm } from "@/lib/confirm";
import { Badge, Button, Chip, ChipRow, Header, Icon, Input, Screen, Sheet, VegDot, haptic } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useMenu } from "@/hooks/queries";
import { supabase, type Tables } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { rupees } from "@/lib/format";
import { useToast } from "@/store/toast";
import { pickAndUpload } from "@/lib/upload";
import { removeBackground, bgRemoveSupported } from "@/lib/bg-remove";

const allergenPool = ["Peanuts", "Tree nuts", "Dairy", "Gluten", "Shellfish", "Egg", "Soy", "Sesame"];

export default function OwnerMenu() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: menu } = useMenu(restaurant?.id);
  const qc = useQueryClient();
  const toast = useToast();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<Tables<"menu_items">> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Tables<"menu_categories">> | null>(null);

  async function toggleAvailable(id: string, current: boolean) {
    await supabase.from("menu_items").update({ is_available: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["menu"] });
  }

  async function deleteItem(id: string) {
    confirm("Delete item?", "This cannot be undone.", async () => {
      await supabase.from("menu_items").delete().eq("id", id);
      qc.invalidateQueries({ queryKey: ["menu"] });
    });
  }

  const shown = activeCategory
    ? (menu?.items ?? []).filter((i) => i.category_id === activeCategory)
    : (menu?.items ?? []);

  return (
    <Screen scroll={false}>
      <Header
        title="Menu"
        subtitle={`${menu?.categories.length ?? 0} categories • ${menu?.items.length ?? 0} items`}
        right={
          <Pressable onPress={() => setEditingCategory({})} className="rounded-full bg-dime-bg-2 px-3 py-1.5">
            <Text className="text-[12px] font-bold text-dime-ink-2">+ Category</Text>
          </Pressable>
        }
      />

      <View className="px-5">
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

      <FlatList
        data={shown}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setEditingItem(item)} className="flex-row gap-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            {item.images[0] ? (
              <Image source={{ uri: item.images[0] }} className="h-16 w-16 rounded-lg" />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-lg bg-dime-bg-2">
                <Icon name="photo.fill" size={20} color="#BFBFBF" />
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <VegDot veg={item.is_veg} />
                <Text className="flex-1 text-[14px] font-bold text-dime-ink">{item.name}</Text>
                {item.is_bestseller ? <Badge tone="gold" label="Best" /> : null}
              </View>
              <Text className="text-[12px] text-dime-ink-2">{rupees(item.price)}</Text>
              <View className="mt-1 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleAvailable(item.id, item.is_available)}
                    trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }}
                  />
                  <Text className="text-[11px] text-dime-ink-3">{item.is_available ? "Available" : "Hidden"}</Text>
                </View>
                <Pressable onPress={() => deleteItem(item.id)} hitSlop={6}>
                  <Icon name="trash" size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="fork.knife" size={32} color="#BFBFBF" />
            <Text className="mt-3 text-[15px] font-bold text-dime-ink">No items yet</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-3">
              {menu?.categories.length === 0 ? "Add a category, then start adding dishes." : "Tap + Add Item below."}
            </Text>
          </View>
        }
      />

      <View className="absolute bottom-6 right-4">
        <Button
          label="Add item"
          leading={<Icon name="plus" size={14} color="#fff" />}
          onPress={() => {
            if (!menu?.categories.length) {
              toast.warn("Add a category first");
              setEditingCategory({});
              return;
            }
            setEditingItem({});
          }}
        />
      </View>

      <ItemEditor
        item={editingItem}
        categories={menu?.categories ?? []}
        restaurantId={restaurant?.id}
        onClose={() => setEditingItem(null)}
        onSaved={() => {
          setEditingItem(null);
          qc.invalidateQueries({ queryKey: ["menu"] });
        }}
      />

      <CategoryEditor
        category={editingCategory}
        restaurantId={restaurant?.id}
        nextOrder={menu?.categories.length ?? 0}
        onClose={() => setEditingCategory(null)}
        onSaved={() => {
          setEditingCategory(null);
          qc.invalidateQueries({ queryKey: ["menu"] });
        }}
      />
    </Screen>
  );
}

function ItemEditor({
  item,
  categories,
  restaurantId,
  onClose,
  onSaved,
}: {
  item: Partial<Tables<"menu_items">> | null;
  categories: Tables<"menu_categories">[];
  restaurantId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isVeg, setIsVeg] = useState(true);
  const [isBestseller, setBestseller] = useState(false);
  const [spice, setSpice] = useState(0);
  const [prepTime, setPrepTime] = useState("15");
  const [calories, setCalories] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const visible = !!item;

  useStateSync(item, () => {
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setPrice(item?.price != null ? String(item.price) : "");
    setCategoryId(item?.category_id ?? categories[0]?.id ?? null);
    setIsVeg(item?.is_veg ?? true);
    setBestseller(item?.is_bestseller ?? false);
    setSpice(item?.spice_level ?? 0);
    setPrepTime(String(item?.prep_time_minutes ?? 15));
    setCalories(item?.calories != null ? String(item.calories) : "");
    setAllergens(item?.allergens ?? []);
    setImageUrl(item?.images?.[0] ?? null);
  });

  function chooseImageSource() {
    if (!restaurantId) return;
    actionSheet("Add photo", [
      { label: "Take photo", onPress: () => uploadImage("camera") },
      { label: "Choose from gallery", onPress: () => uploadImage("gallery") },
    ]);
  }

  async function uploadImage(source: "gallery" | "camera") {
    if (!restaurantId) return;
    setUploading(true);
    try {
      const url = await pickAndUpload({ bucket: "menu-media", prefix: restaurantId, aspect: [4, 3], source });
      if (url) setImageUrl(url);
    } catch (e) { toast.error("Upload failed", (e as Error).message); }
    finally { setUploading(false); }
  }

  async function handleRemoveBg() {
    if (!imageUrl || !restaurantId) return;
    setRemovingBg(true);
    try {
      const newUrl = await removeBackground(imageUrl, "menu-media", restaurantId);
      setImageUrl(newUrl);
      haptic.success();
      toast.success("Background removed");
    } catch (e) {
      toast.error("Could not remove background", (e as Error).message);
    } finally { setRemovingBg(false); }
  }

  async function save() {
    if (!restaurantId) return;
    if (!name.trim()) return toast.error("Add a name");
    if (!price || isNaN(Number(price))) return toast.error("Enter a price");
    if (!categoryId) return toast.error("Pick a category");
    setSaving(true);
    try {
      const payload = {
        restaurant_id: restaurantId,
        category_id: categoryId,
        name,
        description: description || null,
        price: Number(price),
        is_veg: isVeg,
        is_bestseller: isBestseller,
        spice_level: spice,
        prep_time_minutes: Number(prepTime) || 15,
        calories: calories ? Number(calories) : null,
        allergens,
        images: imageUrl ? [imageUrl] : [],
      };
      if (item?.id) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
      }
      haptic.success();
      toast.success(item?.id ? "Item updated" : "Item added");
      onSaved();
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    } finally { setSaving(false); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{item?.id ? "Edit item" : "New item"}</Text>

        <Pressable onPress={chooseImageSource} disabled={uploading || removingBg} className="mt-4 aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-dime-primary-300 bg-dime-primary-50">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="contain" style={{ backgroundColor: "transparent" }} />
          ) : (
            <View className="items-center">
              <Icon name="camera.fill" size={28} color="#FF6B2C" />
              <Text className="mt-2 text-[13px] font-bold text-dime-primary-700">
                {uploading ? "Uploading..." : "Take photo or choose from gallery"}
              </Text>
            </View>
          )}
        </Pressable>

        {imageUrl ? (
          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={chooseImageSource}
              disabled={uploading || removingBg}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-dime-bg-2 py-2.5"
            >
              <Icon name="arrow.triangle.2.circlepath" size={12} color="#8A8A8A" />
              <Text className="text-[12px] font-bold text-dime-ink-2">Replace</Text>
            </Pressable>
            {bgRemoveSupported ? (
              <Pressable
                onPress={handleRemoveBg}
                disabled={removingBg || uploading}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-dime-ink py-2.5"
              >
                <Icon name="wand.and.stars" size={12} color="#fff" />
                <Text className="text-[12px] font-bold text-white">
                  {removingBg ? "Processing..." : "Remove Background"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="mt-4 gap-4">
          <Input label="Name" value={name} onChangeText={setName} placeholder="Butter Chicken" />
          <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} />
          <View className="flex-row gap-4">
            <View className="flex-1"><Input label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" /></View>
            <View className="flex-1"><Input label="Prep time (min)" value={prepTime} onChangeText={setPrepTime} keyboardType="number-pad" /></View>
          </View>
          <Input label="Calories (optional)" value={calories} onChangeText={setCalories} keyboardType="number-pad" />

          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Category</Text>
            <ChipRow>
              {categories.map((c) => (
                <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
              ))}
            </ChipRow>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 flex-row items-center justify-between rounded-xl bg-white px-3 py-2.5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <View className="flex-row items-center gap-2">
                <VegDot veg={isVeg} />
                <Text className="text-[13px] text-dime-ink">{isVeg ? "Veg" : "Non-veg"}</Text>
              </View>
              <Switch value={isVeg} onValueChange={setIsVeg} trackColor={{ true: "#22C55E", false: "#EF4444" }} />
            </View>
            <View className="flex-1 flex-row items-center justify-between rounded-xl bg-white px-3 py-2.5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <Text className="text-[13px] text-dime-ink">Bestseller</Text>
              <Switch value={isBestseller} onValueChange={setBestseller} trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }} />
            </View>
          </View>

          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Spice level</Text>
            <ChipRow>
              {[0, 1, 2, 3, 4].map((n) => (
                <Chip key={n} label={n === 0 ? "None" : "🌶".repeat(n)} selected={spice === n} onPress={() => setSpice(n)} />
              ))}
            </ChipRow>
          </View>

          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Allergens</Text>
            <ChipRow>
              {allergenPool.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={allergens.includes(a)}
                  onPress={() => setAllergens(allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a])}
                />
              ))}
            </ChipRow>
          </View>
        </View>

        <View className="mt-5">
          <Button label={item?.id ? "Save changes" : "Add to menu"} loading={saving} onPress={save} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

function CategoryEditor({
  category,
  restaurantId,
  nextOrder,
  onClose,
  onSaved,
}: {
  category: Partial<Tables<"menu_categories">> | null;
  restaurantId?: string;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("fork.knife");
  const [saving, setSaving] = useState(false);
  const visible = !!category;

  useStateSync(category, () => {
    setName(category?.name ?? "");
    setIcon(category?.icon ?? "fork.knife");
  });

  async function save() {
    if (!restaurantId || !name.trim()) return toast.error("Add a name");
    setSaving(true);
    try {
      const payload = { restaurant_id: restaurantId, name, icon, sort_order: category?.id ? category.sort_order ?? 0 : nextOrder };
      if (category?.id) {
        await supabase.from("menu_categories").update(payload).eq("id", category.id);
      } else {
        await supabase.from("menu_categories").insert(payload);
      }
      haptic.success();
      onSaved();
    } catch (e) { toast.error("Could not save", (e as Error).message); }
    finally { setSaving(false); }
  }

  const icons = ["fork.knife", "flame.fill", "leaf.fill", "fish.fill", "birthday.cake.fill", "cup.and.saucer.fill", "sunrise.fill"];

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="60%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{category?.id ? "Edit category" : "New category"}</Text>
        <View className="mt-4 gap-4">
          <Input label="Name" value={name} onChangeText={setName} placeholder="Starters, Mains, Desserts..." />
          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Icon</Text>
            <ChipRow>
              {icons.map((i) => (
                <Pressable
                  key={i}
                  onPress={() => setIcon(i)}
                  className={`items-center justify-center rounded-full px-3 py-2 ${icon === i ? "border-2 border-dime-primary-500 bg-dime-primary-50" : "bg-white"}`}
                  style={icon !== i ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 } : undefined}
                >
                  <Icon name={i} size={16} color={icon === i ? "#FF6B2C" : "#8A8A8A"} />
                </Pressable>
              ))}
            </ChipRow>
          </View>
        </View>
        <View className="mt-5">
          <Button label="Save category" loading={saving} onPress={save} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}

// Push the edit target into local form state whenever the editor opens
// against a different item.
function useStateSync<T>(dep: T, fn: () => void) {
  useEffect(() => {
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
}
