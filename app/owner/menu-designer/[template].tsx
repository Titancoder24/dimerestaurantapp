import { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Chip, ChipRow, Header, Icon, Input, Screen, haptic } from "@/components/ui";
import { useToast } from "@/store/toast";
import { templateById } from "@/menu-designer/templates";
import { buildMenuData } from "@/menu-designer/build";
import { useOwnedRestaurant } from "@/hooks/owner";
import { pickAndUpload } from "@/lib/upload";
import { supabase } from "@/lib/supabase";
import type { MenuData, MenuStyle } from "@/menu-designer/types";

export default function MenuDesignerCustomizer() {
  const { template: templateId } = useLocalSearchParams<{ template: string }>();
  const router = useRouter();
  const toast = useToast();
  const template = templateById(templateId);
  const { data: restaurant } = useOwnedRestaurant();

  const [data, setData] = useState<MenuData | null>(null);
  const [style, setStyle] = useState<MenuStyle | null>(null);
  const [exporting, setExporting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const qc = useQueryClient();

  // Initial style from template
  useEffect(() => {
    if (!template) return;
    setStyle({ ...template.defaultStyle });
  }, [template?.id]);

  // Pull live menu data once we know which restaurant
  useEffect(() => {
    if (!restaurant?.id) return;
    buildMenuData(restaurant.id).then(setData).catch((e) => toast.error("Could not load menu", (e as Error).message));
  }, [restaurant?.id]);

  const html = useMemo(() => {
    if (!template || !data || !style) return "";
    return template.render(data, style);
  }, [template, data, style]);

  if (!template) {
    return (
      <Screen>
        <Header title="Menu Designer" back />
        <View className="m-4 rounded-2xl bg-red-50 p-4">
          <Text className="text-[14px] font-semibold text-dime-danger">Template not found</Text>
          <Pressable onPress={() => router.replace("/owner/menu-designer")} className="mt-2">
            <Text className="text-[13px] font-semibold text-dime-orange-600">Back to gallery</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!style || !data) return null;

  function patchStyle(s: Partial<MenuStyle>) {
    setStyle((prev) => ({ ...(prev as MenuStyle), ...s }));
  }
  function patchData(d: Partial<MenuData>) {
    setData((prev) => ({ ...(prev as MenuData), ...d }));
  }

  async function uploadLogo() {
    if (!restaurant?.id) return;
    setUploadingLogo(true);
    try {
      const url = await pickAndUpload({ bucket: "restaurant-media", prefix: `${restaurant.id}/logo` });
      if (!url) return;
      // Persist to the restaurant so it's the default for every future design
      // and shows up in customer-facing surfaces too.
      await supabase.from("restaurants").update({ logo_url: url }).eq("id", restaurant.id);
      qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
      patchData({ logoUrl: url });
      haptic.success();
      toast.success("Logo uploaded", "Now appears on all your menu designs.");
    } catch (e) {
      haptic.error();
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function removeLogo() {
    if (!restaurant?.id) return;
    await supabase.from("restaurants").update({ logo_url: null }).eq("id", restaurant.id);
    qc.invalidateQueries({ queryKey: ["owned-restaurant"] });
    patchData({ logoUrl: null });
    haptic.light();
  }

  async function exportPdf() {
    if (!html) return;
    setExporting(true);
    try {
      if (Platform.OS === "web") {
        // Web: open the rendered HTML in a new tab and trigger native print.
        const win = window.open("", "_blank");
        if (!win) throw new Error("Pop-ups blocked. Allow pop-ups and try again.");
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 400);
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Save your menu PDF" });
        } else {
          toast.success("Saved", uri);
        }
      }
      haptic.success();
    } catch (e) {
      haptic.error();
      toast.error("Export failed", (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function quickPrint() {
    if (!html) return;
    try {
      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (!win) throw new Error("Pop-ups blocked");
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 400);
      } else {
        await Print.printAsync({ html });
      }
      haptic.success();
    } catch (e) {
      toast.error("Print failed", (e as Error).message);
    }
  }

  return (
    <Screen scroll={false}>
      <Header
        title={template.name}
        subtitle={`${data.sections.length} sections • ${data.sections.reduce((n, s) => n + s.items.length, 0)} items`}
        back
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Native preview — silhouette of what the PDF will look like. */}
        <Preview data={data} style={style} />

        <View className="mx-4 mt-5">
          <SectionHeader icon="pencil" title="Header text" />
          <View className="gap-3">
            <Input label="Restaurant name" value={data.restaurantName} onChangeText={(t) => patchData({ restaurantName: t })} />
            <Input label="Tagline" value={data.tagline} onChangeText={(t) => patchData({ tagline: t })} multiline numberOfLines={2} />
            <Input label="Footnote" value={data.footnote} onChangeText={(t) => patchData({ footnote: t })} multiline numberOfLines={2} />
          </View>
        </View>

        <View className="mx-4 mt-5">
          <SectionHeader icon="photo.fill" title="Brand logo" />
          <View className="flex-row gap-3 rounded-2xl border border-dime-border bg-white p-3">
            <Pressable
              onPress={uploadLogo}
              disabled={uploadingLogo}
              className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-dime-orange-300 bg-dime-orange-50"
            >
              {data.logoUrl ? (
                <Image source={{ uri: data.logoUrl }} className="h-full w-full" resizeMode="contain" />
              ) : (
                <View className="items-center">
                  <Icon name="plus" size={18} color="#FC8019" />
                  <Text className="mt-1 text-[9px] font-semibold text-dime-orange-700">Upload</Text>
                </View>
              )}
            </Pressable>
            <View className="flex-1 justify-center">
              <Text className="text-[13px] font-semibold text-dime-ink">{data.logoUrl ? "Logo uploaded" : "Add your logo"}</Text>
              <Text className="mt-0.5 text-[11px] text-dime-ink-3">
                {data.logoUrl
                  ? "Saved to your restaurant. Appears on every menu and across DIME."
                  : "PNG with transparency works best. Will be used everywhere."}
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  onPress={uploadLogo}
                  disabled={uploadingLogo}
                  className="rounded-full border border-dime-border px-3 py-1"
                >
                  <Text className="text-[11px] font-semibold text-dime-orange-600">{uploadingLogo ? "Uploading..." : data.logoUrl ? "Replace" : "Upload"}</Text>
                </Pressable>
                {data.logoUrl ? (
                  <Pressable onPress={removeLogo} className="rounded-full border border-dime-border px-3 py-1">
                    <Text className="text-[11px] font-semibold text-dime-danger">Remove</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => patchStyle({ showLogo: !style.showLogo })}
                  className={`rounded-full border px-3 py-1 ${style.showLogo ? "border-dime-orange-500 bg-dime-orange-50" : "border-dime-border"}`}
                >
                  <Text className={`text-[11px] font-semibold ${style.showLogo ? "text-dime-orange-700" : "text-dime-ink-2"}`}>
                    {style.showLogo ? "Showing on this menu" : "Hidden on this menu"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-5">
          <SectionHeader icon="sparkles" title="Accent color" />
          <View className="flex-row flex-wrap gap-2">
            {template.swatches.map((c) => (
              <Pressable
                key={c}
                onPress={() => { haptic.select(); patchStyle({ accent: c }); }}
                className="h-10 w-10 items-center justify-center rounded-full border-2"
                style={{ backgroundColor: c, borderColor: style.accent === c ? "#1C1C1E" : "transparent" }}
              >
                {style.accent === c ? <Icon name="checkmark" size={14} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mx-4 mt-5">
          <SectionHeader icon="doc.text.fill" title="Typography" />
          <ChipRow>
            {template.fontPairs.map((fp) => {
              const active = style.fontHeading === fp.heading && style.fontBody === fp.body;
              return (
                <Chip
                  key={`${fp.heading}-${fp.body}`}
                  label={`${fp.heading} / ${fp.body}`}
                  selected={active}
                  onPress={() => patchStyle({ fontHeading: fp.heading, fontBody: fp.body })}
                />
              );
            })}
          </ChipRow>
        </View>

        <View className="mx-4 mt-5">
          <SectionHeader icon="gear" title="Layout" />
          <ChipRow>
            <Chip label="A4" selected={style.pageSize === "A4"} onPress={() => patchStyle({ pageSize: "A4" })} />
            <Chip label="US Letter" selected={style.pageSize === "Letter"} onPress={() => patchStyle({ pageSize: "Letter" })} />
            <Chip label={style.showPrices ? "Prices on" : "Prices off"} selected={style.showPrices} onPress={() => patchStyle({ showPrices: !style.showPrices })} />
            <Chip label={style.showVegMarkers ? "Veg markers on" : "Veg markers off"} selected={style.showVegMarkers} onPress={() => patchStyle({ showVegMarkers: !style.showVegMarkers })} />
          </ChipRow>
        </View>

        <View className="mx-4 mt-5">
          <SectionHeader icon="fork.knife" title="Sections in this menu" />
          <View className="rounded-2xl border border-dime-border bg-white">
            {data.sections.map((s, idx) => (
              <View key={`${s.title}-${idx}`} className={`flex-row items-center justify-between p-3 ${idx > 0 ? "border-t border-dime-border" : ""}`}>
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-dime-ink">{s.title}</Text>
                  <Text className="text-[11px] text-dime-ink-3">{s.items.length} items</Text>
                </View>
                <Pressable
                  onPress={() => patchData({ sections: data.sections.filter((_, i) => i !== idx) })}
                  hitSlop={8}
                >
                  <Icon name="trash" size={14} color="#EF4444" />
                </Pressable>
              </View>
            ))}
            {data.sections.length === 0 ? (
              <View className="p-4">
                <Text className="text-[12px] text-dime-ink-3">No sections — add categories and items in the Menu screen first.</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View className="flex-row gap-3 border-t border-dime-border bg-white px-4 py-3">
        <View className="flex-1">
          <Button label="Print preview" variant="secondary" onPress={quickPrint} fullWidth leading={<Icon name="photo.fill" size={14} color="#E06E10" />} />
        </View>
        <View className="flex-1">
          <Button
            label="Export PDF"
            loading={exporting}
            onPress={exportPdf}
            fullWidth
            leading={<Icon name="square.and.arrow.up" size={14} color="#fff" />}
          />
        </View>
      </View>
    </Screen>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View className="mb-2 flex-row items-center gap-2">
      <Icon name={icon} size={14} color="#FC8019" />
      <Text className="text-[13px] font-semibold uppercase tracking-widest text-dime-ink-2">{title}</Text>
    </View>
  );
}

/**
 * In-app silhouette of what the PDF will look like — fast to render
 * and stays in sync with the form state. Not pixel-perfect; the actual
 * PDF uses the OS print engine and Google Fonts for the real output.
 */
function Preview({ data, style }: { data: MenuData; style: MenuStyle }) {
  const sample = data.sections[0]?.items.slice(0, 3) ?? [];
  return (
    <View className="mx-4 mt-3 overflow-hidden rounded-2xl border border-dime-border" style={{ backgroundColor: style.paper }}>
      <View className="aspect-[210/297] p-5">
        {style.showLogo && data.logoUrl ? (
          <Image source={{ uri: data.logoUrl }} style={{ height: 32, width: 64, marginBottom: 8 }} resizeMode="contain" />
        ) : null}
        <View className="self-start" style={{ backgroundColor: style.accent, height: 3, width: 32, borderRadius: 999 }} />
        <Text style={{ color: style.ink, fontSize: 22, fontWeight: "700", marginTop: 8, letterSpacing: -0.5 }} numberOfLines={1}>
          {data.restaurantName || "Your restaurant"}
        </Text>
        <Text style={{ color: style.ink, opacity: 0.6, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
          {data.tagline || "Your tagline appears here."}
        </Text>
        <View style={{ backgroundColor: style.accent, height: 1.5, width: 24, marginTop: 14 }} />

        {data.sections.slice(0, 2).map((sec, i) => (
          <View key={i} className="mt-4">
            <Text style={{ color: style.ink, fontSize: 14, fontWeight: "700" }}>{sec.title}</Text>
            {sec.items.slice(0, 4).map((it, j) => (
              <View key={j} className="mt-2 flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center gap-1.5">
                  {style.showVegMarkers ? (
                    <View style={{ width: 8, height: 8, borderWidth: 1, borderColor: it.is_veg ? "#1f9e57" : "#d63333", padding: 1 }}>
                      <View style={{ flex: 1, backgroundColor: it.is_veg ? "#1f9e57" : "#d63333", borderRadius: 99 }} />
                    </View>
                  ) : null}
                  <Text style={{ color: style.ink, fontSize: 11, fontWeight: "600", flex: 1 }} numberOfLines={1}>{it.name}</Text>
                </View>
                {style.showPrices ? (
                  <Text style={{ color: style.accent, fontSize: 11, fontWeight: "700" }}>₹{Math.round(it.price)}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        {sample.length === 0 ? (
          <View className="mt-6 items-center">
            <Text style={{ color: style.ink, opacity: 0.5, fontSize: 11 }}>Add menu items to see them here</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
