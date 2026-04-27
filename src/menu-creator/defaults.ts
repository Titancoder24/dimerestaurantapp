import type { TextElement, MenuListElement, ImageElement, ShapeElement, MenuItemData } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createText(patch?: Partial<TextElement>): TextElement {
  return {
    id: uid(),
    type: "text",
    x: 40,
    y: 40,
    width: 300,
    height: 50,
    zIndex: 1,
    content: "New text",
    fontSize: 24,
    fontFamily: "Inter",
    fontWeight: "600",
    fontStyle: "normal",
    color: "#1C1C1E",
    textAlign: "left",
    lineHeight: 1.3,
    letterSpacing: 0,
    textTransform: "none",
    backgroundColor: null,
    padding: 0,
    borderRadius: 0,
    ...patch,
  };
}

export function createMenuList(
  items?: MenuItemData[],
  patch?: Partial<MenuListElement>,
): MenuListElement {
  return {
    id: uid(),
    type: "menu-list",
    x: 40,
    y: 200,
    width: 515,
    height: 400,
    zIndex: 1,
    items: items ?? [
      { name: "Menu Item", price: "₹299" },
      { name: "Another Item", price: "₹399", desc: "With description" },
    ],
    listStyle: "minimal",
    fontSize: 14,
    fontFamily: "Inter",
    color: "#1C1C1E",
    accentColor: "#FF6B2C",
    showPrices: true,
    showVegDots: true,
    itemSpacing: 12,
    ...patch,
  };
}

export function createImage(patch?: Partial<ImageElement>): ImageElement {
  return {
    id: uid(),
    type: "image",
    x: 40,
    y: 40,
    width: 200,
    height: 200,
    zIndex: 1,
    url: "",
    fit: "cover",
    borderRadius: 0,
    opacity: 1,
    ...patch,
  };
}

export function createShape(patch?: Partial<ShapeElement>): ShapeElement {
  return {
    id: uid(),
    type: "shape",
    x: 40,
    y: 40,
    width: 200,
    height: 100,
    zIndex: 1,
    shape: "rect",
    fill: "#FF6B2C",
    stroke: "transparent",
    strokeWidth: 0,
    borderRadius: 0,
    ...patch,
  };
}
