import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Chip, Header, Icon, Screen, haptic } from "@/components/ui";
import { confirm } from "@/lib/confirm";
import { TEMPLATES } from "@/menu-creator/templates";
import { loadDesigns, deleteDesign } from "@/menu-creator/saved";
import { useOwnedRestaurant } from "@/hooks/owner";
import { timeAgo } from "@/lib/format";
import type { TemplateCategory } from "@/menu-creator/types";

const categoryLabels: Record<TemplateCategory | "all", string> = {
  all: "All",
  minimal: "Minimal",
  classic: "Classic",
  bold: "Bold",
  elegant: "Elegant",
  casual: "Casual",
  cuisine: "Cuisine",
  themed: "Themed",
};

const categoryOrder: (TemplateCategory | "all")[] = [
  "all", "minimal", "classic", "bold", "elegant", "casual", "cuisine", "themed",
];

export default function MenuCreatorGallery() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: restaurant } = useOwnedRestaurant();
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [tab, setTab] = useState<"templates" | "saved">("templates");

  const { data: savedDesigns } = useQuery({
    queryKey: ["menu-designs", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: () => loadDesigns(restaurant!.id),
  });

  const filtered =
    category === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  async function removeSaved(id: string) {
    confirm("Delete design?", "This cannot be undone.", async () => {
      await deleteDesign(id);
      qc.invalidateQueries({ queryKey: ["menu-designs"] });
    });
  }

  return (
    <Screen scroll={false}>
      <Header title="Menu Creator" subtitle={`${TEMPLATES.length} templates`} />

      <View className="mx-5 rounded-2xl bg-dime-primary-50 p-4">
        <View className="flex-row items-center gap-2">
          <Icon name="sparkles" size={16} color="#FF6B2C" />
          <Text className="text-[14px] font-bold text-dime-primary-700">
            Design print-ready menus
          </Text>
        </View>
        <Text className="mt-1 text-[12px] text-dime-primary-700/80">
          Pick a template, customize on canvas, edit items inline, then export as
          PDF, PNG, or JPEG.
        </Text>
      </View>

      {/* Tab Switcher */}
      <View className="mx-5 mt-4 flex-row rounded-xl bg-dime-bg-2 p-1">
        <Pressable
          onPress={() => setTab("templates")}
          className={`flex-1 items-center rounded-lg py-2 ${tab === "templates" ? "bg-white" : ""}`}
          style={
            tab === "templates"
              ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }
              : undefined
          }
        >
          <Text className={`text-[13px] font-bold ${tab === "templates" ? "text-dime-ink" : "text-dime-ink-3"}`}>
            Templates
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("saved")}
          className={`flex-1 items-center rounded-lg py-2 ${tab === "saved" ? "bg-white" : ""}`}
          style={
            tab === "saved"
              ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }
              : undefined
          }
        >
          <Text className={`text-[13px] font-bold ${tab === "saved" ? "text-dime-ink" : "text-dime-ink-3"}`}>
            Saved{savedDesigns?.length ? ` (${savedDesigns.length})` : ""}
          </Text>
        </Pressable>
      </View>

      {tab === "templates" ? (
        <>
          {/* Category Filter */}
          <View className="mt-3 px-5">
            <FlatList
              horizontal
              data={categoryOrder}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Chip
                  label={categoryLabels[item]}
                  selected={category === item}
                  onPress={() => { haptic.select(); setCategory(item); }}
                />
              )}
            />
          </View>

          {/* Template Grid */}
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }}
            renderItem={({ item: t }) => (
              <Pressable
                onPress={() => {
                  haptic.light();
                  router.push({
                    pathname: "/owner/menu-designer/[template]",
                    params: { template: t.id },
                  });
                }}
                className="flex-1 overflow-hidden rounded-2xl bg-white"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
              >
                <Thumbnail
                  accent={t.defaultStyle.accent}
                  paper={t.defaultStyle.paper}
                  ink={t.defaultStyle.ink}
                  name={t.name}
                />
                <View className="p-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="flex-1 text-[13px] font-bold text-dime-ink" numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Badge tone="gray" label={t.category} />
                  </View>
                  <Text numberOfLines={1} className="mt-0.5 text-[11px] text-dime-ink-3">
                    {t.description}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Text className="text-[13px] text-dime-ink-3">
                  No templates in this category.
                </Text>
              </View>
            }
          />
        </>
      ) : (
        /* Saved Designs */
        <FlatList
          data={savedDesigns ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
          renderItem={({ item: d }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/owner/menu-designer/[template]",
                  params: { template: d.template_id },
                })
              }
              className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-dime-primary-50">
                <Icon name="doc.fill" size={18} color="#FF6B2C" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-dime-ink">{d.name}</Text>
                <Text className="text-[11px] text-dime-ink-3">
                  {TEMPLATES.find((t) => t.id === d.template_id)?.name ?? d.template_id} ·{" "}
                  {timeAgo(d.updated_at)}
                </Text>
              </View>
              <Pressable onPress={() => removeSaved(d.id)} hitSlop={8}>
                <Icon name="trash" size={14} color="#EF4444" />
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Icon name="doc.fill" size={28} color="#BFBFBF" />
              <Text className="mt-3 text-[15px] font-bold text-dime-ink">
                No saved designs
              </Text>
              <Text className="mt-1 text-[13px] text-dime-ink-3">
                Pick a template and save your customized menu.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

function Thumbnail({
  accent,
  paper,
  ink,
  name,
}: {
  accent: string;
  paper: string;
  ink: string;
  name: string;
}) {
  return (
    <View style={{ backgroundColor: paper }} className="aspect-[3/4] p-3 items-center justify-center">
      <View style={{ backgroundColor: accent, opacity: 0.15 }} className="absolute inset-0" />
      <View style={{ backgroundColor: accent }} className="h-1 w-8 rounded-full" />
      <Text
        style={{ color: ink, fontSize: 11, fontWeight: "700", marginTop: 6 }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <View className="mt-3 w-full gap-1.5">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row justify-between">
            <View
              style={{ backgroundColor: ink, opacity: 0.15 }}
              className="h-0.5 flex-1 rounded-full"
            />
            <View style={{ width: 8 }} />
            <View
              style={{ backgroundColor: accent, opacity: 0.4 }}
              className="h-0.5 w-6 rounded-full"
            />
          </View>
        ))}
      </View>
    </View>
  );
}
