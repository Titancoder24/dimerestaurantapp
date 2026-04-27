import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Header, Icon, Screen, Sheet, haptic } from "@/components/ui";
import { useToast } from "@/store/toast";
import { useAuth } from "@/store/auth";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useEditor } from "@/menu-creator/store";
import { templateById } from "@/menu-creator/templates";
import { createText, createMenuList, createShape, createImage } from "@/menu-creator/defaults";
import { saveDesign } from "@/menu-creator/saved";
import { exportDesign, type ExportFormat } from "@/menu-creator/export";
import { CANVAS_W, CANVAS_H, FONT_OPTIONS, COLOR_PALETTE } from "@/menu-creator/types";
import type {
  CanvasElement,
  TextElement,
  MenuListElement,
  ShapeElement,
  ImageElement,
  MenuItemData,
} from "@/menu-creator/types";
import { supabase } from "@/lib/supabase";
import { pickAndUpload } from "@/lib/upload";

const SHADOW = { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 };

async function webPickAndUpload(bucket: string, prefix: string): Promise<string | null> {
  if (Platform.OS !== "web") return null;
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });
      if (error) { resolve(null); return; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      resolve(data.publicUrl);
    };
    input.click();
  });
}

async function uploadImage(restaurantId: string, prefix: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return webPickAndUpload("restaurant-media", `${restaurantId}/${prefix}`);
  }
  return pickAndUpload({ bucket: "restaurant-media", prefix: `${restaurantId}/${prefix}` });
}

export default function MenuCreatorEditor() {
  const { template: templateId } = useLocalSearchParams<{ template: string }>();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const profile = useAuth((s) => s.profile);
  const { data: restaurant } = useOwnedRestaurant();
  const { width: winW } = useWindowDimensions();
  const wideScreen = winW >= 900;
  const uploadPrefix = restaurant?.id ?? profile?.id ?? "tmp";

  const editor = useEditor();
  const { design, selectedId, editingTextId, zoom } = editor;

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [designId, setDesignId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("Untitled");
  const [exportSheet, setExportSheet] = useState(false);
  const [propsSheet, setPropsSheet] = useState(false);
  const [addSheet, setAddSheet] = useState(false);
  const [menuItemSheet, setMenuItemSheet] = useState(false);

  const template = templateById(templateId);
  const initialized = useRef(false);

  useEffect(() => {
    if (!template || initialized.current) return;
    initialized.current = true;
    fetchMenuAndInit();
  }, [template?.id, restaurant?.id]);

  async function fetchMenuAndInit() {
    if (!template || !restaurant?.id) {
      if (template) editor.init(template.build([], restaurant?.name ?? "Restaurant", ""));
      return;
    }
    try {
      const { data: cats } = await supabase
        .from("menu_categories")
        .select("id, name, menu_items(id, name, price, description, is_veg)")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true });

      const items: MenuItemData[] = (cats ?? []).flatMap((c) =>
        (c.menu_items ?? []).map((it: { name: string; price: number; description?: string; is_veg?: boolean }) => ({
          name: it.name,
          price: `₹${Math.round(it.price)}`,
          desc: it.description || undefined,
          isVeg: it.is_veg ?? undefined,
        })),
      );

      editor.init(template.build(items, restaurant.name ?? "Restaurant", ""));
    } catch {
      editor.init(template.build([], restaurant?.name ?? "Restaurant", ""));
    }
  }

  const selectedEl = design.elements.find((el) => el.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedEl && !wideScreen) setPropsSheet(true);
  }, [selectedId]);

  async function handleSave() {
    if (!restaurant?.id) return;
    setSaving(true);
    try {
      const res = await saveDesign(restaurant.id, templateId, designName, design, designId ?? undefined);
      setDesignId(res.id);
      haptic.success();
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["menu-designs"] });
    } catch (e) {
      haptic.error();
      toast.error("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    setExportSheet(false);
    try {
      const slug = (restaurant?.name ?? "menu").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "menu";
      await exportDesign(design, format, slug);
      haptic.success();
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e) {
      haptic.error();
      toast.error("Export failed", (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  if (!template) {
    return (
      <Screen>
        <Header title="Menu Creator" back />
        <View className="m-5 rounded-2xl bg-red-50 p-5">
          <Text className="text-[14px] font-bold text-dime-danger">Template not found</Text>
          <Pressable onPress={() => router.replace("/owner/menu-designer")} className="mt-2">
            <Text className="text-[13px] font-bold text-dime-primary-600">Back to gallery</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* ── Top Bar ── */}
      <View className="flex-row items-center border-b border-neutral-200 bg-white px-3 py-2" style={SHADOW}>
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2 rounded-lg bg-dime-bg-2 p-2">
          <Icon name="chevron.left" size={16} color="#3A3A3C" />
        </Pressable>
        <TextInput
          value={designName}
          onChangeText={setDesignName}
          className="mr-3 flex-1 rounded-lg bg-dime-bg-2 px-3 py-1.5 text-[14px] font-bold text-dime-ink"
          placeholder="Design name"
        />

        {/* Undo / Redo */}
        <Pressable onPress={() => editor.undo()} disabled={!editor.past.length} hitSlop={6} className="rounded-lg bg-dime-bg-2 p-2">
          <Icon name="arrow.uturn.backward" size={15} color={editor.past.length ? "#3A3A3C" : "#D1D1D6"} />
        </Pressable>
        <Pressable onPress={() => editor.redo()} disabled={!editor.future.length} hitSlop={6} className="ml-1 mr-2 rounded-lg bg-dime-bg-2 p-2">
          <Icon name="arrow.uturn.forward" size={15} color={editor.future.length ? "#3A3A3C" : "#D1D1D6"} />
        </Pressable>

        {/* Zoom */}
        <View className="mr-2 flex-row items-center rounded-lg bg-dime-bg-2">
          <Pressable onPress={() => editor.setZoom(zoom - 0.15)} className="px-2 py-2">
            <Icon name="minus.magnifyingglass" size={15} color="#3A3A3C" />
          </Pressable>
          <Pressable onPress={() => editor.setZoom(1)} className="px-1">
            <Text className="min-w-[36px] text-center text-[12px] font-bold text-dime-ink-2">{Math.round(zoom * 100)}%</Text>
          </Pressable>
          <Pressable onPress={() => editor.setZoom(zoom + 0.15)} className="px-2 py-2">
            <Icon name="plus.magnifyingglass" size={15} color="#3A3A3C" />
          </Pressable>
        </View>

        {/* Delete (visible when element selected) */}
        {selectedId ? (
          <Pressable
            onPress={() => { editor.removeElement(selectedId); }}
            hitSlop={6}
            className="mr-2 rounded-lg bg-red-50 p-2"
          >
            <Icon name="trash" size={15} color="#EF4444" />
          </Pressable>
        ) : null}

        <Pressable onPress={handleSave} disabled={saving} className="mr-2 flex-row items-center gap-1.5 rounded-lg bg-dime-bg-2 px-3 py-2">
          <Icon name="doc.fill" size={13} color="#3A3A3C" />
          <Text className="text-[12px] font-bold text-dime-ink-2">{saving ? "Saving..." : "Save"}</Text>
        </Pressable>
        <Pressable onPress={() => setExportSheet(true)} disabled={exporting} className="flex-row items-center gap-1.5 rounded-lg bg-dime-primary-600 px-3 py-2">
          <Icon name="square.and.arrow.up" size={13} color="#FFFFFF" />
          <Text className="text-[12px] font-bold text-white">{exporting ? "Exporting..." : "Export"}</Text>
        </Pressable>
      </View>

      {/* ── Main Layout ── */}
      <View className="flex-1 flex-row">
        {/* Left Toolbar */}
        {wideScreen ? (
          <View className="w-[56px] items-center border-r border-neutral-200 bg-white py-4">
            <ToolBtn icon="textformat" label="Text" onPress={() => { editor.snapshot(); editor.addElement(createText()); }} />
            <ToolBtn icon="list.bullet" label="List" onPress={() => { editor.snapshot(); editor.addElement(createMenuList()); }} />
            <ToolBtn icon="photo.fill" label="Image" onPress={() => { editor.snapshot(); editor.addElement(createImage()); }} />
            <ToolBtn icon="square.fill" label="Shape" onPress={() => { editor.snapshot(); editor.addElement(createShape()); }} />
            <View className="my-3 h-px w-8 bg-neutral-200" />
            <ToolBtn icon="paintbrush.fill" label="BG" onPress={() => { editor.select(null); if (!wideScreen) setPropsSheet(true); }} />
          </View>
        ) : null}

        {/* Canvas Area */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Canvas
            design={design}
            selectedId={selectedId}
            editingTextId={editingTextId}
            zoom={zoom}
            containerWidth={wideScreen ? winW - 56 - 300 - 32 : winW - 32}
            onSelectElement={(id) => editor.select(id)}
            onDeselectAll={() => editor.select(null)}
            onStartTextEdit={(id) => editor.startTextEdit(id)}
            onMoveElement={(id, x, y) => editor.moveElement(id, x, y)}
            onSnapshot={() => editor.snapshot()}
            onUpdateElement={(id, patch) => editor.updateElement(id, patch)}
          />
        </ScrollView>

        {/* Right Properties Panel (wide only) */}
        {wideScreen ? (
          <View className="w-[300px] border-l border-neutral-200 bg-white">
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {selectedEl ? (
                <ElementProperties
                  element={selectedEl}
                  onUpdate={(patch) => { editor.snapshot(); editor.updateElement(selectedEl.id, patch); }}
                  onRemove={() => editor.removeElement(selectedEl.id)}
                  onDuplicate={() => editor.duplicate(selectedEl.id)}
                  onReorder={(dir) => editor.reorder(selectedEl.id, dir)}
                  onOpenMenuItems={() => setMenuItemSheet(true)}
                  uploadPrefix={uploadPrefix}
                />
              ) : (
                <CanvasProperties
                  design={design}
                  onUpdate={(p) => { editor.snapshot(); editor.updateDesign(p); }}
                  uploadPrefix={uploadPrefix}
                />
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Mobile Bottom Bar */}
      {!wideScreen ? (
        <View className="flex-row items-center border-t border-neutral-200 bg-white px-3 py-2">
          <ToolBtn icon="plus.circle.fill" label="Add" onPress={() => setAddSheet(true)} />
          <ToolBtn icon="slider.horizontal.3" label="Edit" onPress={() => setPropsSheet(true)} />
          {selectedId ? (
            <>
              <ToolBtn icon="doc.on.doc" label="Copy" onPress={() => { if (selectedId) editor.duplicate(selectedId); }} />
              <ToolBtn icon="trash" label="Del" onPress={() => { if (selectedId) editor.removeElement(selectedId); }} />
            </>
          ) : null}
        </View>
      ) : null}

      {/* ── Sheets ── */}
      <Sheet visible={exportSheet} onClose={() => setExportSheet(false)}>
        <Sheet.Body>
          <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Export</Text>
          <View className="mt-4 gap-2">
            {([
              { f: "pdf" as ExportFormat, l: "PDF", d: "Print-ready vector output", ic: "doc.fill" },
              { f: "png" as ExportFormat, l: "PNG", d: "High-quality transparent image", ic: "photo.fill" },
              { f: "jpeg" as ExportFormat, l: "JPEG", d: "Compressed image, smaller file", ic: "photo.fill" },
            ]).map((o) => (
              <Pressable key={o.f} onPress={() => handleExport(o.f)} className="flex-row items-center gap-4 rounded-xl bg-dime-bg-2 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-dime-primary-50">
                  <Icon name={o.ic} size={16} color="#FF6B2C" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-dime-ink">{o.l}</Text>
                  <Text className="text-[11px] text-dime-ink-3">{o.d}</Text>
                </View>
                <Icon name="arrow.down.circle.fill" size={20} color="#FF6B2C" />
              </Pressable>
            ))}
          </View>
        </Sheet.Body>
      </Sheet>

      <Sheet visible={addSheet} onClose={() => setAddSheet(false)}>
        <Sheet.Body>
          <Text className="mb-3 text-[18px] font-bold text-dime-ink">Add element</Text>
          {[
            { label: "Text", icon: "textformat", fn: () => editor.addElement(createText()) },
            { label: "Menu List", icon: "list.bullet", fn: () => editor.addElement(createMenuList()) },
            { label: "Image", icon: "photo.fill", fn: () => editor.addElement(createImage()) },
            { label: "Rectangle", icon: "square.fill", fn: () => editor.addElement(createShape({ shape: "rect" })) },
            { label: "Circle", icon: "circle.fill", fn: () => editor.addElement(createShape({ shape: "circle", borderRadius: 999 })) },
            { label: "Line", icon: "minus", fn: () => editor.addElement(createShape({ shape: "line", width: 200, height: 2, fill: "#1C1C1E" })) },
          ].map((o) => (
            <Pressable key={o.label} onPress={() => { editor.snapshot(); o.fn(); setAddSheet(false); }} className="flex-row items-center gap-4 rounded-xl py-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-dime-bg-2">
                <Icon name={o.icon} size={16} color="#3A3A3C" />
              </View>
              <Text className="text-[14px] font-bold text-dime-ink">{o.label}</Text>
            </Pressable>
          ))}
        </Sheet.Body>
      </Sheet>

      {/* Mobile Properties Sheet */}
      {!wideScreen ? (
        <Sheet visible={propsSheet} onClose={() => setPropsSheet(false)} maxHeight="70%">
          <Sheet.Body>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEl ? (
                <ElementProperties
                  element={selectedEl}
                  onUpdate={(patch) => { editor.snapshot(); editor.updateElement(selectedEl.id, patch); }}
                  onRemove={() => { editor.removeElement(selectedEl.id); setPropsSheet(false); }}
                  onDuplicate={() => editor.duplicate(selectedEl.id)}
                  onReorder={(dir) => editor.reorder(selectedEl.id, dir)}
                  onOpenMenuItems={() => setMenuItemSheet(true)}
                  uploadPrefix={uploadPrefix}
                />
              ) : (
                <CanvasProperties
                  design={design}
                  onUpdate={(p) => { editor.snapshot(); editor.updateDesign(p); }}
                  uploadPrefix={uploadPrefix}
                />
              )}
            </ScrollView>
          </Sheet.Body>
        </Sheet>
      ) : null}

      {/* Menu Items Editor Sheet */}
      <MenuItemEditorSheet
        visible={menuItemSheet}
        onClose={() => setMenuItemSheet(false)}
        element={selectedEl?.type === "menu-list" ? (selectedEl as MenuListElement) : null}
        onUpdate={(items) => {
          if (!selectedEl) return;
          editor.snapshot();
          editor.updateElement(selectedEl.id, { items });
        }}
      />
    </View>
  );
}

// ── Tool Button ──────────────────────────────────────────
function ToolBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="items-center px-3 py-2">
      <Icon name={icon} size={18} color="#3A3A3C" />
      <Text className="mt-0.5 text-[9px] text-dime-ink-3">{label}</Text>
    </Pressable>
  );
}

// ── Canvas ───────────────────────────────────────────────
function Canvas({
  design,
  selectedId,
  editingTextId,
  zoom,
  containerWidth,
  onSelectElement,
  onDeselectAll,
  onStartTextEdit,
  onMoveElement,
  onSnapshot,
  onUpdateElement,
}: {
  design: import("@/menu-creator/types").MenuDesign;
  selectedId: string | null;
  editingTextId: string | null;
  zoom: number;
  containerWidth: number;
  onSelectElement: (id: string) => void;
  onDeselectAll: () => void;
  onStartTextEdit: (id: string) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onSnapshot: () => void;
  onUpdateElement: (id: string, patch: Record<string, unknown>) => void;
}) {
  const baseScale = Math.min(containerWidth / CANVAS_W, 1);
  const scale = baseScale * zoom;
  const canvasW = CANVAS_W * scale;
  const canvasH = CANVAS_H * scale;

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    elX: number;
    elY: number;
    snapped: boolean;
  } | null>(null);

  const sorted = [...design.elements].sort((a, b) => a.zIndex - b.zIndex);

  const handlePointerDown = useCallback(
    (el: CanvasElement, pageX: number, pageY: number) => {
      onSelectElement(el.id);
      onSnapshot();
      dragRef.current = { id: el.id, startX: pageX, startY: pageY, elX: el.x, elY: el.y, snapped: true };
    },
    [onSelectElement, onSnapshot],
  );

  const handlePointerMove = useCallback(
    (pageX: number, pageY: number) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (pageX - d.startX) / scale;
      const dy = (pageY - d.startY) / scale;
      onMoveElement(d.id, Math.round(d.elX + dx), Math.round(d.elY + dy));
    },
    [scale, onMoveElement],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const lastTap = useRef<{ id: string; time: number }>({ id: "", time: 0 });

  function handleTap(el: CanvasElement) {
    const now = Date.now();
    if (lastTap.current.id === el.id && now - lastTap.current.time < 350) {
      if (el.type === "text") onStartTextEdit(el.id);
      lastTap.current = { id: "", time: 0 };
    } else {
      lastTap.current = { id: el.id, time: now };
    }
  }

  return (
    <View
      style={{ width: canvasW, height: canvasH, backgroundColor: design.backgroundColor, overflow: "hidden", borderRadius: 4 }}
      {...(Platform.OS === "web"
        ? {
            onPointerMove: (e: { nativeEvent: { pageX: number; pageY: number } }) => handlePointerMove(e.nativeEvent.pageX, e.nativeEvent.pageY),
            onPointerUp: handlePointerUp,
            onPointerLeave: handlePointerUp,
          }
        : {
            onStartShouldSetResponder: () => !!dragRef.current,
            onResponderMove: (e: { nativeEvent: { pageX: number; pageY: number } }) => handlePointerMove(e.nativeEvent.pageX, e.nativeEvent.pageY),
            onResponderRelease: handlePointerUp,
          })}
    >
      {/* Background image */}
      {design.backgroundImage ? (
        <Image
          source={{ uri: design.backgroundImage }}
          style={{ position: "absolute", width: "100%", height: "100%", opacity: design.backgroundOpacity }}
          resizeMode="cover"
        />
      ) : null}

      {/* Deselect on background tap */}
      <Pressable
        style={{ position: "absolute", width: "100%", height: "100%" }}
        onPress={onDeselectAll}
      />

      {/* Elements */}
      {sorted.map((el) => (
        <CanvasElementView
          key={el.id}
          element={el}
          scale={scale}
          selected={el.id === selectedId}
          editing={el.id === editingTextId}
          onPointerDown={(px, py) => handlePointerDown(el, px, py)}
          onTap={() => handleTap(el)}
          onUpdateContent={(content) => onUpdateElement(el.id, { content })}
        />
      ))}

      {/* Canvas border */}
      <View
        style={{ position: "absolute", inset: 0, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", borderRadius: 4 }}
        pointerEvents="none"
      />
    </View>
  );
}

// ── Element Renderer ─────────────────────────────────────
function CanvasElementView({
  element: el,
  scale,
  selected,
  editing,
  onPointerDown,
  onTap,
  onUpdateContent,
}: {
  element: CanvasElement;
  scale: number;
  selected: boolean;
  editing: boolean;
  onPointerDown: (px: number, py: number) => void;
  onTap: () => void;
  onUpdateContent: (c: string) => void;
}) {
  const webProps =
    Platform.OS === "web"
      ? {
          onPointerDown: (e: { nativeEvent: { pageX: number; pageY: number }; stopPropagation: () => void }) => {
            e.stopPropagation();
            onPointerDown(e.nativeEvent.pageX, e.nativeEvent.pageY);
          },
        }
      : {};

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        onTap();
      }}
      {...(Platform.OS !== "web"
        ? {
            onLongPress: () => onPointerDown(0, 0),
          }
        : {})}
      {...webProps}
      style={{
        position: "absolute",
        left: el.x * scale,
        top: el.y * scale,
        width: el.width * scale,
        height: el.height * scale,
        zIndex: el.zIndex + 10,
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? "#007AFF" : "transparent",
        borderStyle: "solid",
        ...(Platform.OS === "web" ? { cursor: "move" as never } : {}),
      }}
    >
      <View style={{ transform: [{ scale }], transformOrigin: "top left", width: el.width, height: el.height }}>
        {el.type === "text" ? <TextRenderer el={el as TextElement} editing={editing} onUpdate={onUpdateContent} /> : null}
        {el.type === "menu-list" ? <MenuListRenderer el={el as MenuListElement} /> : null}
        {el.type === "shape" ? <ShapeRenderer el={el as ShapeElement} /> : null}
        {el.type === "image" ? <ImageRenderer el={el as ImageElement} /> : null}
      </View>

      {/* Resize handle */}
      {selected ? (
        <View
          style={{
            position: "absolute",
            right: -4,
            bottom: -4,
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: "#007AFF",
            borderWidth: 1,
            borderColor: "#fff",
          }}
        />
      ) : null}
    </Pressable>
  );
}

function TextRenderer({ el, editing, onUpdate }: { el: TextElement; editing: boolean; onUpdate: (c: string) => void }) {
  if (editing) {
    return (
      <TextInput
        autoFocus
        multiline
        value={el.content}
        onChangeText={onUpdate}
        style={{
          width: el.width,
          height: el.height,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          color: el.color,
          textAlign: el.textAlign,
          lineHeight: el.fontSize * el.lineHeight,
          letterSpacing: el.letterSpacing,
          textTransform: el.textTransform,
          backgroundColor: el.backgroundColor ?? "transparent",
          padding: el.padding,
          borderRadius: el.borderRadius,
        }}
      />
    );
  }
  return (
    <Text
      numberOfLines={0}
      style={{
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle,
        color: el.color,
        textAlign: el.textAlign,
        lineHeight: el.fontSize * el.lineHeight,
        letterSpacing: el.letterSpacing,
        textTransform: el.textTransform,
        backgroundColor: el.backgroundColor ?? "transparent",
        padding: el.padding,
        borderRadius: el.borderRadius,
      }}
    >
      {el.content}
    </Text>
  );
}

function MenuListRenderer({ el }: { el: MenuListElement }) {
  return (
    <View style={{ gap: el.itemSpacing }}>
      {el.items.map((item, i) => (
        <View key={i}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 4 }}>
              {el.showVegDots && item.isVeg !== undefined ? (
                <View style={{ width: 8, height: 8, borderWidth: 1.5, borderColor: item.isVeg ? "#1f9e57" : "#d63333" }}>
                  <View style={{ width: 4, height: 4, borderRadius: 99, backgroundColor: item.isVeg ? "#1f9e57" : "#d63333", margin: "auto" }} />
                </View>
              ) : null}
              <Text style={{ flex: 1, fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: "600", color: el.color }} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            {el.listStyle === "dotted" ? (
              <View style={{ flex: 1, borderBottomWidth: 1, borderStyle: "dotted", borderColor: "rgba(0,0,0,0.15)", marginHorizontal: 6 }} />
            ) : null}
            {el.showPrices ? (
              <Text style={{ fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: "700", color: el.accentColor }}>
                {item.price}
              </Text>
            ) : null}
          </View>
          {item.desc ? (
            <Text style={{ fontSize: el.fontSize - 2, color: el.color, opacity: 0.55, marginTop: 2 }} numberOfLines={2}>
              {item.desc}
            </Text>
          ) : null}
          {el.listStyle === "bordered" ? (
            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginTop: el.itemSpacing / 2 }} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function ShapeRenderer({ el }: { el: ShapeElement }) {
  const radius = el.shape === "circle" ? el.width / 2 : el.borderRadius;
  return (
    <View
      style={{
        width: el.width,
        height: el.height,
        backgroundColor: el.fill,
        borderWidth: el.strokeWidth,
        borderColor: el.stroke,
        borderRadius: radius,
      }}
    />
  );
}

function ImageRenderer({ el }: { el: ImageElement }) {
  if (!el.url) {
    return (
      <View style={{ width: el.width, height: el.height, backgroundColor: "#F0F0F0", borderRadius: el.borderRadius, alignItems: "center", justifyContent: "center" }}>
        <Icon name="photo.fill" size={24} color="#D1D1D6" />
        <Text style={{ fontSize: 10, color: "#8E8E93", marginTop: 4 }}>No image</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: el.url }}
      style={{ width: el.width, height: el.height, borderRadius: el.borderRadius, opacity: el.opacity }}
      resizeMode={el.fit === "cover" ? "cover" : el.fit === "contain" ? "contain" : "stretch"}
    />
  );
}

// ── Properties Panels ────────────────────────────────────
function ElementProperties({
  element,
  onUpdate,
  onRemove,
  onDuplicate,
  onReorder,
  onOpenMenuItems,
  uploadPrefix,
}: {
  element: CanvasElement;
  onUpdate: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onReorder: (dir: "up" | "down") => void;
  onOpenMenuItems: () => void;
  uploadPrefix: string;
}) {
  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1 }}>
          {element.type === "text" ? "Text" : element.type === "menu-list" ? "Menu List" : element.type === "image" ? "Image" : "Shape"}
        </Text>
        <View className="flex-row gap-1">
          <Pressable onPress={() => onReorder("down")} hitSlop={4} className="rounded bg-dime-bg-2 p-1.5">
            <Icon name="chevron.down" size={10} color="#8A8A8A" />
          </Pressable>
          <Pressable onPress={() => onReorder("up")} hitSlop={4} className="rounded bg-dime-bg-2 p-1.5">
            <Icon name="chevron.up" size={10} color="#8A8A8A" />
          </Pressable>
          <Pressable onPress={onDuplicate} hitSlop={4} className="rounded bg-dime-bg-2 p-1.5">
            <Icon name="doc.on.doc" size={10} color="#8A8A8A" />
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={4} className="rounded bg-red-50 p-1.5">
            <Icon name="trash" size={10} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {/* Position & Size */}
      <PropSection title="Position & Size">
        <View className="flex-row gap-2">
          <NumInput label="X" value={element.x} onChange={(v) => onUpdate({ x: v })} />
          <NumInput label="Y" value={element.y} onChange={(v) => onUpdate({ y: v })} />
        </View>
        <View className="mt-2 flex-row gap-2">
          <NumInput label="W" value={element.width} onChange={(v) => onUpdate({ width: v })} />
          <NumInput label="H" value={element.height} onChange={(v) => onUpdate({ height: v })} />
        </View>
      </PropSection>

      {element.type === "text" ? <TextProperties el={element as TextElement} onUpdate={onUpdate} /> : null}
      {element.type === "menu-list" ? <MenuListProperties el={element as MenuListElement} onUpdate={onUpdate} onOpenItems={onOpenMenuItems} /> : null}
      {element.type === "image" ? <ImageProperties el={element as ImageElement} onUpdate={onUpdate} uploadPrefix={uploadPrefix} /> : null}
      {element.type === "shape" ? <ShapeProperties el={element as ShapeElement} onUpdate={onUpdate} /> : null}
    </View>
  );
}

function TextProperties({ el, onUpdate }: { el: TextElement; onUpdate: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <PropSection title="Content">
        <TextInput
          value={el.content}
          onChangeText={(t) => onUpdate({ content: t })}
          multiline
          className="rounded-lg bg-dime-bg-2 p-2 text-[13px] text-dime-ink"
          style={{ minHeight: 60 }}
        />
      </PropSection>
      <PropSection title="Font">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {FONT_OPTIONS.map((f) => (
              <Pressable
                key={f}
                onPress={() => onUpdate({ fontFamily: f })}
                className={`rounded-lg px-2.5 py-1.5 ${el.fontFamily === f ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
              >
                <Text style={{ fontFamily: f, fontSize: 11, fontWeight: el.fontFamily === f ? "700" : "400", color: el.fontFamily === f ? "#FF6B2C" : "#3A3A3C" }}>
                  {f.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View className="flex-row gap-2">
          <NumInput label="Size" value={el.fontSize} onChange={(v) => onUpdate({ fontSize: v })} step={1} />
          <View className="flex-1">
            <Text className="mb-1 text-[10px] text-dime-ink-4">Weight</Text>
            <View className="flex-row gap-1">
              {(["400", "600", "700", "800", "900"] as const).map((w) => (
                <Pressable
                  key={w}
                  onPress={() => onUpdate({ fontWeight: w })}
                  className={`flex-1 items-center rounded py-1 ${el.fontWeight === w ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
                >
                  <Text style={{ fontSize: 9, fontWeight: w, color: el.fontWeight === w ? "#FF6B2C" : "#8A8A8A" }}>{w}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View className="mt-2 flex-row gap-2">
          <View className="flex-1 flex-row gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <Pressable
                key={a}
                onPress={() => onUpdate({ textAlign: a })}
                className={`flex-1 items-center rounded py-1.5 ${el.textAlign === a ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
              >
                <Icon name={a === "left" ? "text.alignleft" : a === "center" ? "text.aligncenter" : "text.alignright"} size={12} color={el.textAlign === a ? "#FF6B2C" : "#8A8A8A"} />
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => onUpdate({ fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}
            className={`items-center rounded px-3 py-1.5 ${el.fontStyle === "italic" ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
          >
            <Text style={{ fontStyle: "italic", fontSize: 12, color: el.fontStyle === "italic" ? "#FF6B2C" : "#8A8A8A" }}>I</Text>
          </Pressable>
        </View>
      </PropSection>
      <PropSection title="Color">
        <ColorGrid value={el.color} onChange={(c) => onUpdate({ color: c })} />
      </PropSection>
      <PropSection title="Spacing">
        <View className="flex-row gap-2">
          <NumInput label="Line H" value={el.lineHeight} onChange={(v) => onUpdate({ lineHeight: v })} step={0.1} decimals={1} />
          <NumInput label="Letter" value={el.letterSpacing} onChange={(v) => onUpdate({ letterSpacing: v })} step={0.5} decimals={1} />
        </View>
      </PropSection>
      <PropSection title="Transform">
        <View className="flex-row gap-1">
          {(["none", "uppercase", "lowercase"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => onUpdate({ textTransform: t })}
              className={`flex-1 items-center rounded py-1.5 ${el.textTransform === t ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: el.textTransform === t ? "#FF6B2C" : "#8A8A8A" }}>
                {t === "none" ? "Aa" : t === "uppercase" ? "AA" : "aa"}
              </Text>
            </Pressable>
          ))}
        </View>
      </PropSection>
    </>
  );
}

function MenuListProperties({
  el,
  onUpdate,
  onOpenItems,
}: {
  el: MenuListElement;
  onUpdate: (p: Record<string, unknown>) => void;
  onOpenItems: () => void;
}) {
  return (
    <>
      <PropSection title="List Style">
        <View className="flex-row gap-1">
          {(["minimal", "dotted", "bordered", "card"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => onUpdate({ listStyle: s })}
              className={`flex-1 items-center rounded py-1.5 ${el.listStyle === s ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: el.listStyle === s ? "#FF6B2C" : "#8A8A8A" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </PropSection>
      <PropSection title="Font">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {FONT_OPTIONS.map((f) => (
              <Pressable
                key={f}
                onPress={() => onUpdate({ fontFamily: f })}
                className={`rounded-lg px-2.5 py-1.5 ${el.fontFamily === f ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
              >
                <Text style={{ fontFamily: f, fontSize: 11, fontWeight: el.fontFamily === f ? "700" : "400", color: el.fontFamily === f ? "#FF6B2C" : "#3A3A3C" }}>
                  {f.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View className="mt-2 flex-row gap-2">
          <NumInput label="Size" value={el.fontSize} onChange={(v) => onUpdate({ fontSize: v })} step={1} />
          <NumInput label="Spacing" value={el.itemSpacing} onChange={(v) => onUpdate({ itemSpacing: v })} step={1} />
        </View>
      </PropSection>
      <PropSection title="Colors">
        <Text className="mb-1 text-[10px] text-dime-ink-4">Text</Text>
        <ColorGrid value={el.color} onChange={(c) => onUpdate({ color: c })} />
        <Text className="mb-1 mt-2 text-[10px] text-dime-ink-4">Price accent</Text>
        <ColorGrid value={el.accentColor} onChange={(c) => onUpdate({ accentColor: c })} />
      </PropSection>
      <PropSection title="Display">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => onUpdate({ showPrices: !el.showPrices })}
            className={`flex-1 items-center rounded-lg py-2 ${el.showPrices ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: el.showPrices ? "#FF6B2C" : "#8A8A8A" }}>Prices</Text>
          </Pressable>
          <Pressable
            onPress={() => onUpdate({ showVegDots: !el.showVegDots })}
            className={`flex-1 items-center rounded-lg py-2 ${el.showVegDots ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: el.showVegDots ? "#FF6B2C" : "#8A8A8A" }}>Veg dots</Text>
          </Pressable>
        </View>
      </PropSection>
      <PropSection title={`Items (${el.items.length})`}>
        <Pressable onPress={onOpenItems} className="rounded-xl bg-dime-primary-50 p-3">
          <View className="flex-row items-center gap-2">
            <Icon name="pencil" size={14} color="#FF6B2C" />
            <Text className="text-[13px] font-bold text-dime-primary-700">Edit menu items</Text>
          </View>
        </Pressable>
      </PropSection>
    </>
  );
}

function ImageProperties({
  el,
  onUpdate,
  uploadPrefix,
}: {
  el: ImageElement;
  onUpdate: (p: Record<string, unknown>) => void;
  uploadPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function pickImage() {
    setUploading(true);
    try {
      const url = await uploadImage(uploadPrefix, "menu-img");
      if (url) onUpdate({ url });
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PropSection title="Image">
        <Pressable onPress={pickImage} disabled={uploading} className="rounded-xl bg-dime-primary-50 p-3">
          <View className="flex-row items-center gap-2">
            <Icon name="photo.fill" size={14} color="#FF6B2C" />
            <Text className="text-[13px] font-bold text-dime-primary-700">{uploading ? "Uploading..." : el.url ? "Replace image" : "Upload image"}</Text>
          </View>
        </Pressable>
      </PropSection>
      <PropSection title="Fit">
        <View className="flex-row gap-1">
          {(["cover", "contain", "fill"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => onUpdate({ fit: f })}
              className={`flex-1 items-center rounded py-1.5 ${el.fit === f ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: el.fit === f ? "#FF6B2C" : "#8A8A8A" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </PropSection>
      <PropSection title="Style">
        <View className="flex-row gap-2">
          <NumInput label="Radius" value={el.borderRadius} onChange={(v) => onUpdate({ borderRadius: v })} step={2} />
          <NumInput label="Opacity" value={el.opacity} onChange={(v) => onUpdate({ opacity: v })} step={0.05} decimals={2} />
        </View>
      </PropSection>
    </>
  );
}

function ShapeProperties({ el, onUpdate }: { el: ShapeElement; onUpdate: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <PropSection title="Shape">
        <View className="flex-row gap-1">
          {(["rect", "circle", "line"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => onUpdate({ shape: s })}
              className={`flex-1 items-center rounded py-1.5 ${el.shape === s ? "bg-dime-primary-100" : "bg-dime-bg-2"}`}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: el.shape === s ? "#FF6B2C" : "#8A8A8A" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </PropSection>
      <PropSection title="Fill">
        <ColorGrid value={el.fill} onChange={(c) => onUpdate({ fill: c })} />
      </PropSection>
      <PropSection title="Stroke">
        <ColorGrid value={el.stroke} onChange={(c) => onUpdate({ stroke: c })} />
        <View className="mt-2">
          <NumInput label="Width" value={el.strokeWidth} onChange={(v) => onUpdate({ strokeWidth: v })} step={1} />
        </View>
      </PropSection>
      <PropSection title="Corner Radius">
        <NumInput label="Radius" value={el.borderRadius} onChange={(v) => onUpdate({ borderRadius: v })} step={2} />
      </PropSection>
    </>
  );
}

function CanvasProperties({
  design,
  onUpdate,
  uploadPrefix,
}: {
  design: import("@/menu-creator/types").MenuDesign;
  onUpdate: (p: Partial<import("@/menu-creator/types").MenuDesign>) => void;
  uploadPrefix: string;
}) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function pickBg() {
    setUploading(true);
    try {
      const url = await uploadImage(uploadPrefix, "menu-bg");
      if (url) onUpdate({ backgroundImage: url });
    } catch (e) {
      toast.error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <Text className="mb-3 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1 }}>Canvas</Text>
      <PropSection title="Background Color">
        <ColorGrid value={design.backgroundColor} onChange={(c) => onUpdate({ backgroundColor: c })} />
      </PropSection>
      <PropSection title="Background Image">
        <Pressable onPress={pickBg} disabled={uploading} className="rounded-xl bg-dime-primary-50 p-3">
          <View className="flex-row items-center gap-2">
            <Icon name="photo.fill" size={14} color="#FF6B2C" />
            <Text className="text-[13px] font-bold text-dime-primary-700">
              {uploading ? "Uploading..." : design.backgroundImage ? "Replace background" : "Add background image"}
            </Text>
          </View>
        </Pressable>
        {design.backgroundImage ? (
          <View className="mt-2">
            <View className="flex-row gap-2">
              <NumInput label="Opacity" value={design.backgroundOpacity} onChange={(v) => onUpdate({ backgroundOpacity: v })} step={0.05} decimals={2} />
              <View className="flex-1 justify-end">
                <Pressable onPress={() => onUpdate({ backgroundImage: null })} className="items-center rounded-lg bg-red-50 py-2">
                  <Text className="text-[11px] font-bold text-red-500">Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </PropSection>
      <PropSection title="Size">
        <View className="flex-row gap-2">
          <NumInput label="Width" value={design.canvasWidth} onChange={(v) => onUpdate({ canvasWidth: v })} />
          <NumInput label="Height" value={design.canvasHeight} onChange={(v) => onUpdate({ canvasHeight: v })} />
        </View>
      </PropSection>
    </View>
  );
}

// ── Shared UI ────────────────────────────────────────────
function PropSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 0.8 }}>{title}</Text>
      {children}
    </View>
  );
}

function NumInput({
  label,
  value,
  onChange,
  step = 1,
  decimals = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  decimals?: number;
}) {
  return (
    <View className="flex-1">
      <Text className="mb-1 text-[10px] text-dime-ink-4">{label}</Text>
      <View className="flex-row items-center rounded-lg bg-dime-bg-2">
        <Pressable onPress={() => onChange(+(value - step).toFixed(decimals))} className="px-2 py-1.5">
          <Icon name="minus" size={10} color="#8A8A8A" />
        </Pressable>
        <TextInput
          value={decimals ? value.toFixed(decimals) : String(Math.round(value))}
          onChangeText={(t) => {
            const n = parseFloat(t);
            if (!isNaN(n)) onChange(n);
          }}
          keyboardType="decimal-pad"
          className="flex-1 text-center text-[12px] text-dime-ink"
          style={{ padding: 0 }}
        />
        <Pressable onPress={() => onChange(+(value + step).toFixed(decimals))} className="px-2 py-1.5">
          <Icon name="plus" size={10} color="#8A8A8A" />
        </Pressable>
      </View>
    </View>
  );
}

function ColorGrid({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {COLOR_PALETTE.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: c,
            borderWidth: value === c ? 2.5 : 1,
            borderColor: value === c ? "#007AFF" : "rgba(0,0,0,0.08)",
          }}
        />
      ))}
    </View>
  );
}

// ── Menu Item Editor Sheet ───────────────────────────────
function MenuItemEditorSheet({
  visible,
  onClose,
  element,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  element: MenuListElement | null;
  onUpdate: (items: MenuItemData[]) => void;
}) {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  useEffect(() => {
    if (element) setItems([...element.items]);
  }, [visible, element?.id]);

  function save() {
    onUpdate(items);
    onClose();
  }

  function addItem() {
    setItems([...items, { name: "New Item", price: "₹0" }]);
    setEditIdx(items.length);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
    setEditIdx(null);
  }

  function updateItem(idx: number, patch: Partial<MenuItemData>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="80%">
      <Sheet.Body>
        <View className="flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Menu Items</Text>
          <Pressable onPress={addItem} className="rounded-lg bg-dime-primary-50 px-3 py-1.5">
            <Text className="text-[12px] font-bold text-dime-primary-700">+ Add</Text>
          </Pressable>
        </View>
        <ScrollView className="mt-3" style={{ maxHeight: 400 }}>
          {items.map((it, i) => (
            <View key={i} className="mb-2 rounded-xl bg-dime-bg-2 p-3">
              {editIdx === i ? (
                <View className="gap-2">
                  <TextInput
                    value={it.name}
                    onChangeText={(t) => updateItem(i, { name: t })}
                    className="rounded-lg bg-white p-2 text-[13px] text-dime-ink"
                    placeholder="Item name"
                  />
                  <View className="flex-row gap-2">
                    <TextInput
                      value={it.price}
                      onChangeText={(t) => updateItem(i, { price: t })}
                      className="flex-1 rounded-lg bg-white p-2 text-[13px] text-dime-ink"
                      placeholder="₹199"
                    />
                    <Pressable
                      onPress={() => updateItem(i, { isVeg: !(it.isVeg ?? true) })}
                      className={`items-center justify-center rounded-lg px-3 ${it.isVeg !== false ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <Text className={`text-[11px] font-bold ${it.isVeg !== false ? "text-green-600" : "text-red-500"}`}>
                        {it.isVeg !== false ? "Veg" : "Non-veg"}
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={it.desc ?? ""}
                    onChangeText={(t) => updateItem(i, { desc: t || undefined })}
                    className="rounded-lg bg-white p-2 text-[13px] text-dime-ink"
                    placeholder="Description (optional)"
                    multiline
                  />
                  <View className="flex-row gap-2">
                    <Pressable onPress={() => setEditIdx(null)} className="flex-1 items-center rounded-lg bg-dime-primary-100 py-2">
                      <Text className="text-[12px] font-bold text-dime-primary-700">Done</Text>
                    </Pressable>
                    <Pressable onPress={() => removeItem(i)} className="items-center rounded-lg bg-red-50 px-4 py-2">
                      <Text className="text-[12px] font-bold text-red-500">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setEditIdx(i)} className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-dime-ink" numberOfLines={1}>{it.name}</Text>
                    {it.desc ? <Text className="text-[11px] text-dime-ink-3" numberOfLines={1}>{it.desc}</Text> : null}
                  </View>
                  <Text className="text-[12px] font-bold text-dime-primary-600">{it.price}</Text>
                </Pressable>
              )}
            </View>
          ))}
          {items.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-[13px] text-dime-ink-3">No items yet</Text>
            </View>
          ) : null}
        </ScrollView>
        <View className="mt-4">
          <Button label="Apply" onPress={save} fullWidth />
        </View>
      </Sheet.Body>
    </Sheet>
  );
}
