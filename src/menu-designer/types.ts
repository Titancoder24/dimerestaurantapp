export type MenuItem = {
  name: string;
  description?: string | null;
  price: number;
  is_veg: boolean;
  is_bestseller?: boolean;
  spice_level?: number;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export type MenuData = {
  restaurantName: string;
  tagline: string;
  footnote: string;
  sections: MenuSection[];
};

export type MenuStyle = {
  accent: string;        // hex color
  ink: string;           // primary text color
  paper: string;         // background color
  fontHeading: string;   // CSS font-family
  fontBody: string;
  pageSize: "A4" | "Letter";
  showPrices: boolean;
  showVegMarkers: boolean;
};

export type MenuTemplate = {
  id: string;
  name: string;
  description: string;
  defaultStyle: MenuStyle;
  swatches: string[];          // accent presets that look great with this template
  fontPairs: { heading: string; body: string }[];
  render: (data: MenuData, style: MenuStyle) => string;
};
