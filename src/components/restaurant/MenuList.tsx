import { useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Badge, Icon, Sheet, Stepper, VegDot, Button, haptic } from "@/components/ui";
import { rupees } from "@/lib/format";
import { surface } from "@/lib/visual";
import type { Tables } from "@/lib/supabase";

type MenuData = {
  categories: Tables<"menu_categories">[];
  items: Tables<"menu_items">[];
};

type Props = {
  data: MenuData | undefined;
  onAdd?: (item: Tables<"menu_items">) => void;
};

export function MenuList({ data, onAdd }: Props) {
  const [detail, setDetail] = useState<Tables<"menu_items"> | null>(null);

  const groups = useMemo(() => {
    if (!data) return [];
    return data.categories
      .map((c) => ({ category: c, items: data.items.filter((i) => i.category_id === c.id && i.is_available) }))
      .filter((g) => g.items.length > 0);
  }, [data]);

  if (!data) {
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: surface.ink3 }}>Loading menu…</Text>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: surface.ink3 }}>No items yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 24 }}>
      {groups.map((g) => (
        <View key={g.category.id}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: surface.ink3,
              marginBottom: 12,
            }}
          >
            {g.category.name} ({g.items.length})
          </Text>
          <View style={{ gap: 12 }}>
            {g.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => { haptic.light(); setDetail(item); }}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  backgroundColor: "#fff",
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: surface.hairline,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <VegDot veg={item.is_veg} />
                    {item.is_bestseller ? <Badge tone="gold" label="Bestseller" /> : null}
                  </View>
                  <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "700", color: surface.ink, letterSpacing: -0.2 }}>
                    {item.name}
                  </Text>
                  <Text style={{ marginTop: 1, fontSize: 13, fontWeight: "600", color: surface.ink }}>
                    {rupees(item.price)}
                  </Text>
                  {item.description ? (
                    <Text numberOfLines={2} style={{ marginTop: 6, fontSize: 12, lineHeight: 17, color: surface.ink3 }}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                {item.images[0] ? (
                  <Image source={{ uri: item.images[0] }} style={{ width: 88, height: 88, borderRadius: 12 }} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <ItemSheet
        item={detail}
        onClose={() => setDetail(null)}
        onAdd={(item) => { onAdd?.(item); setDetail(null); }}
      />
    </View>
  );
}

function ItemSheet({
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
        {item.images[0] ? (
          <Image source={{ uri: item.images[0] }} className="-mx-6 h-52" resizeMode="cover" />
        ) : null}
        <View className="mt-5 flex-row items-center gap-2">
          <VegDot veg={item.is_veg} />
          {item.is_bestseller ? <Badge tone="gold" label="Bestseller" /> : null}
        </View>
        <Text className="mt-2 text-[22px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{item.name}</Text>
        <Text className="mt-0.5 text-[16px] font-bold text-dime-ink-2">{rupees(item.price)}</Text>
        {item.description ? <Text className="mt-3 text-[14px] leading-[20px] text-dime-ink-2">{item.description}</Text> : null}
        <View className="mt-6 flex-row items-center justify-between">
          <Stepper value={qty} onChange={setQty} />
          <Button
            label={`Add ${qty} · ${rupees(Number(item.price) * qty)}`}
            onPress={() => {
              for (let i = 0; i < qty; i++) onAdd(item);
            }}
          />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}
