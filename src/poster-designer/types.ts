export type PosterData = {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  ctaText?: string | null;
  imageUrl?: string | null;
};

export type PosterStyle = {
  accent: string;
  ink: string;
  paper: string;
  fontHeading: string;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  showImage: boolean;
};

export type PosterTemplate = {
  id: string;
  name: string;
  description: string;
  swatches: string[];
  defaultStyle: PosterStyle;
  /**
   * Render a native React Element. The host (banner card, ad-feed item,
   * preview, full-screen) provides a width — height is derived from the
   * 16:9 aspect (or whatever the host requires).
   */
  Render: React.ComponentType<{ data: PosterData; style: PosterStyle; width: number }>;
};
