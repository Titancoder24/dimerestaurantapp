import { create } from "zustand";
import type { MenuDesign, CanvasElement } from "./types";
import { CANVAS_W, CANVAS_H } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const EMPTY: MenuDesign = {
  name: "Untitled",
  canvasWidth: CANVAS_W,
  canvasHeight: CANVAS_H,
  backgroundColor: "#FFFFFF",
  backgroundImage: null,
  backgroundOpacity: 1,
  elements: [],
};

type EditorStore = {
  design: MenuDesign;
  selectedId: string | null;
  editingTextId: string | null;
  zoom: number;
  past: MenuDesign[];
  future: MenuDesign[];

  init: (d: MenuDesign) => void;
  snapshot: () => void;
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, patch: Record<string, unknown>) => void;
  removeElement: (id: string) => void;
  select: (id: string | null) => void;
  startTextEdit: (id: string) => void;
  stopTextEdit: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  reorder: (id: string, dir: "up" | "down") => void;
  duplicate: (id: string) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (z: number) => void;
  updateDesign: (patch: Partial<MenuDesign>) => void;
};

function snap(d: MenuDesign): MenuDesign {
  return JSON.parse(JSON.stringify(d));
}

export const useEditor = create<EditorStore>((set, get) => ({
  design: EMPTY,
  selectedId: null,
  editingTextId: null,
  zoom: 1,
  past: [],
  future: [],

  init: (d) =>
    set({ design: d, selectedId: null, editingTextId: null, past: [], future: [], zoom: 1 }),

  snapshot: () => {
    const { design, past } = get();
    set({ past: [...past.slice(-40), snap(design)], future: [] });
  },

  addElement: (el) => {
    const { design, past } = get();
    set({
      past: [...past.slice(-40), snap(design)],
      future: [],
      design: { ...design, elements: [...design.elements, el] },
      selectedId: el.id,
      editingTextId: null,
    });
  },

  updateElement: (id, patch) => {
    const { design } = get();
    set({
      design: {
        ...design,
        elements: design.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as CanvasElement) : el,
        ),
      },
    });
  },

  removeElement: (id) => {
    const { design, past } = get();
    set({
      past: [...past.slice(-40), snap(design)],
      future: [],
      design: { ...design, elements: design.elements.filter((el) => el.id !== id) },
      selectedId: null,
      editingTextId: null,
    });
  },

  select: (id) => set({ selectedId: id, editingTextId: null }),
  startTextEdit: (id) => set({ selectedId: id, editingTextId: id }),
  stopTextEdit: () => set({ editingTextId: null }),

  moveElement: (id, x, y) => {
    const { design } = get();
    set({
      design: {
        ...design,
        elements: design.elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
      },
    });
  },

  resizeElement: (id, width, height) => {
    const { design } = get();
    set({
      design: {
        ...design,
        elements: design.elements.map((el) =>
          el.id === id ? { ...el, width, height } : el,
        ),
      },
    });
  },

  reorder: (id, dir) => {
    const { design, past } = get();
    const idx = design.elements.findIndex((el) => el.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx + 1 : idx - 1;
    if (target < 0 || target >= design.elements.length) return;
    const els = [...design.elements];
    [els[idx], els[target]] = [els[target]!, els[idx]!];
    const updated = els.map((el, i) => ({ ...el, zIndex: i + 1 }));
    set({
      past: [...past.slice(-40), snap(design)],
      future: [],
      design: { ...design, elements: updated },
    });
  },

  duplicate: (id) => {
    const { design, past } = get();
    const el = design.elements.find((e) => e.id === id);
    if (!el) return;
    const clone = {
      ...JSON.parse(JSON.stringify(el)),
      id: uid(),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: design.elements.length + 1,
    } as CanvasElement;
    set({
      past: [...past.slice(-40), snap(design)],
      future: [],
      design: { ...design, elements: [...design.elements, clone] },
      selectedId: clone.id,
    });
  },

  undo: () => {
    const { past, design, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1]!;
    set({
      past: past.slice(0, -1),
      future: [snap(design), ...future.slice(0, 40)],
      design: prev,
      selectedId: null,
      editingTextId: null,
    });
  },

  redo: () => {
    const { past, design, future } = get();
    if (future.length === 0) return;
    const next = future[0]!;
    set({
      past: [...past, snap(design)],
      future: future.slice(1),
      design: next,
      selectedId: null,
      editingTextId: null,
    });
  },

  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(2.5, z)) }),

  updateDesign: (patch) => {
    const { design } = get();
    set({ design: { ...design, ...patch } });
  },
}));
