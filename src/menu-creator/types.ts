export type TextElement = {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "400" | "600" | "700" | "800" | "900";
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  textTransform: "none" | "uppercase" | "lowercase";
  backgroundColor: string | null;
  padding: number;
  borderRadius: number;
};

export type MenuItemData = {
  name: string;
  price: string;
  desc?: string;
  isVeg?: boolean;
};

export type MenuListElement = {
  id: string;
  type: "menu-list";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  items: MenuItemData[];
  listStyle: "minimal" | "dotted" | "bordered" | "card";
  fontSize: number;
  fontFamily: string;
  color: string;
  accentColor: string;
  showPrices: boolean;
  showVegDots: boolean;
  itemSpacing: number;
};

export type ImageElement = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  url: string;
  fit: "cover" | "contain" | "fill";
  borderRadius: number;
  opacity: number;
};

export type ShapeElement = {
  id: string;
  type: "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  shape: "rect" | "circle" | "line";
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
};

export type CanvasElement = TextElement | MenuListElement | ImageElement | ShapeElement;

export type MenuDesign = {
  id?: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOpacity: number;
  elements: CanvasElement[];
};

export type TemplateCategory = "minimal" | "classic" | "bold" | "elegant" | "casual" | "cuisine" | "themed";

export type MenuTemplate = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  defaultStyle: { paper: string; accent: string; ink: string };
  build: (items: MenuItemData[], restaurantName: string, tagline: string) => MenuDesign;
};

export const CANVAS_W = 595;
export const CANVAS_H = 842;

export const FONT_OPTIONS = [
  "Inter",
  "Playfair Display",
  "Cormorant Garamond",
  "Bebas Neue",
  "Lora",
  "Poppins",
  "Caveat",
  "Montserrat",
  "Merriweather",
  "Quicksand",
  "Pacifico",
  "Raleway",
  "Nunito",
  "DM Sans",
  "Libre Baskerville",
] as const;

export const COLOR_PALETTE = [
  "#000000", "#FFFFFF", "#1C1C1E", "#3A3A3C",
  "#8E8E93", "#FF6B2C", "#FF3B30", "#FF9500",
  "#FFCC00", "#34C759", "#00C7BE", "#30B0C7",
  "#007AFF", "#5856D6", "#AF52DE", "#FF2D55",
  "#D4AF37", "#8B5E3C", "#2D1810", "#F4EDDD",
  "#1A1A1A", "#1B2826", "#264653", "#0E9594",
];
