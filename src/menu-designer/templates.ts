import type { MenuData, MenuStyle, MenuTemplate } from "./types";

// Tiny HTML escape so user-entered names/descriptions can't break the layout.
const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rupee = (n: number): string =>
  "₹" + Math.round(n).toLocaleString("en-IN");

// Shared <head> snippet — Google Fonts import + size box.
function head(style: MenuStyle, extra = ""): string {
  const fonts = encodeURI([style.fontHeading, style.fontBody, "Inter"].filter(Boolean).join("|"));
  return `
    <meta charset="utf-8" />
    <link href="https://fonts.googleapis.com/css?family=${fonts}&display=swap" rel="stylesheet">
    <style>
      @page { size: ${style.pageSize === "Letter" ? "Letter" : "A4"}; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body {
        font-family: "${style.fontBody}", system-ui, sans-serif;
        color: ${style.ink};
        background: ${style.paper};
        line-height: 1.4;
      }
      h1, h2, h3, .heading {
        font-family: "${style.fontHeading}", Georgia, serif;
        margin: 0;
      }
      .veg, .nv {
        display: inline-block;
        width: 9px; height: 9px;
        border: 1.5px solid;
        position: relative;
        margin-right: 6px;
        vertical-align: middle;
      }
      .veg { border-color: #1f9e57; }
      .nv  { border-color: #d63333; }
      .veg::after, .nv::after {
        content: ""; position: absolute; inset: 2px; border-radius: 50%;
      }
      .veg::after { background: #1f9e57; }
      .nv::after  { background: #d63333; }
      .best-pill {
        display: inline-block; padding: 1px 6px; border-radius: 999px;
        font-size: 9px; letter-spacing: 0.06em; font-weight: 700; text-transform: uppercase;
      }
      ${extra}
    </style>
  `;
}

// Render an item line. `mode` controls visual style.
function renderItem(it: MenuData["sections"][number]["items"][number], style: MenuStyle, mode: "row" | "stacked" = "row"): string {
  const veg = style.showVegMarkers ? `<span class="${it.is_veg ? "veg" : "nv"}"></span>` : "";
  const best = it.is_bestseller ? `<span class="best-pill">Bestseller</span>` : "";
  const price = style.showPrices ? rupee(Number(it.price)) : "";
  if (mode === "stacked") {
    return `
      <div class="item stacked">
        <div class="row1">${veg}<span class="iname">${esc(it.name)}</span> ${best}</div>
        ${it.description ? `<div class="desc">${esc(it.description)}</div>` : ""}
        ${price ? `<div class="price">${price}</div>` : ""}
      </div>
    `;
  }
  return `
    <div class="item row">
      <div class="left">
        <div class="row1">${veg}<span class="iname">${esc(it.name)}</span> ${best}</div>
        ${it.description ? `<div class="desc">${esc(it.description)}</div>` : ""}
      </div>
      ${price ? `<div class="dots"></div><div class="price">${price}</div>` : ""}
    </div>
  `;
}

// Render full sections.
function renderSections(data: MenuData, style: MenuStyle, mode: "row" | "stacked" = "row"): string {
  return data.sections.map((s) => `
    <section class="section">
      <h2 class="section-title">${esc(s.title)}</h2>
      <div class="items">
        ${s.items.map((i) => renderItem(i, style, mode)).join("")}
      </div>
    </section>
  `).join("");
}

// ============ TEMPLATES ============

const sleekModern: MenuTemplate = {
  id: "sleek-modern",
  name: "Sleek Modern",
  description: "Clean, lots of whitespace, single column.",
  swatches: ["#FC8019", "#0EA5E9", "#10B981", "#000000", "#7C3AED"],
  fontPairs: [{ heading: "Inter", body: "Inter" }, { heading: "Manrope", body: "Inter" }],
  defaultStyle: {
    accent: "#FC8019", ink: "#1C1C1E", paper: "#FFFFFF",
    fontHeading: "Inter", fontBody: "Inter",
    pageSize: "A4", showPrices: true, showVegMarkers: true,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 56px 64px; min-height: 96vh; }
      .brand { font-size: 12px; letter-spacing: 0.4em; text-transform: uppercase; color: ${s.accent}; font-weight: 700; }
      .name { font-size: 56px; font-weight: 700; margin-top: 6px; letter-spacing: -0.02em; }
      .tag { font-size: 14px; color: #5b5b5b; margin-top: 6px; max-width: 480px; }
      .divider { height: 2px; background: ${s.accent}; width: 60px; margin: 32px 0; }
      .section { margin-bottom: 28px; page-break-inside: avoid; }
      .section-title { font-size: 22px; font-weight: 700; margin-bottom: 14px; }
      .item { display: flex; align-items: baseline; gap: 8px; padding: 8px 0; border-bottom: 1px dashed #e5e5e5; }
      .item:last-child { border-bottom: 0; }
      .left { flex: 1; }
      .row1 { font-size: 16px; font-weight: 600; }
      .desc { font-size: 12px; color: #6b6b6b; margin-top: 2px; }
      .dots { flex: 0 1 60px; border-bottom: 1px dotted #ccc; transform: translateY(-4px); }
      .price { font-size: 15px; font-weight: 600; }
      .best-pill { background: ${s.accent}1a; color: ${s.accent}; }
      .footer { margin-top: 40px; font-size: 11px; color: #8e8e93; }
    `)}</head><body><div class="page">
      <div class="brand">Menu</div>
      <h1 class="name">${esc(d.restaurantName)}</h1>
      <div class="tag">${esc(d.tagline)}</div>
      <div class="divider"></div>
      ${renderSections(d, s, "row")}
      <div class="footer">${esc(d.footnote)}</div>
    </div></body></html>
  `,
};

const vintageBistro: MenuTemplate = {
  id: "vintage-bistro",
  name: "Vintage Bistro",
  description: "Cream paper, ornate borders, two-column classic.",
  swatches: ["#8B5E3C", "#2D1810", "#7B2D26", "#114B5F", "#3F4739"],
  fontPairs: [{ heading: "Playfair Display", body: "Lora" }, { heading: "Cormorant Garamond", body: "Lora" }],
  defaultStyle: {
    accent: "#8B5E3C", ink: "#2D1810", paper: "#F4EDDD",
    fontHeading: "Playfair Display", fontBody: "Lora",
    pageSize: "A4", showPrices: true, showVegMarkers: true,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 48px; min-height: 96vh; position: relative; }
      .frame { border: 2px solid ${s.accent}; padding: 40px 44px; min-height: 92vh; position: relative; }
      .frame::before { content: ""; position: absolute; inset: 6px; border: 1px solid ${s.accent}; pointer-events: none; }
      .header { text-align: center; margin-bottom: 28px; }
      .pre { font-size: 12px; letter-spacing: 0.5em; text-transform: uppercase; }
      .name { font-size: 52px; font-style: italic; font-weight: 700; margin: 6px 0; }
      .tag { font-size: 14px; font-style: italic; }
      .crest { width: 80px; height: 1px; background: ${s.accent}; margin: 14px auto; position: relative; }
      .crest::before { content: "❦"; position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: ${s.paper}; padding: 0 8px; font-size: 18px; color: ${s.accent}; }
      .columns { columns: 2; column-gap: 32px; }
      .section { break-inside: avoid; margin-bottom: 24px; }
      .section-title { font-size: 22px; font-style: italic; text-align: center; margin-bottom: 12px; color: ${s.accent}; }
      .item { padding: 8px 0; }
      .row1 { font-size: 15px; font-weight: 700; display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
      .iname { flex: 1; }
      .desc { font-size: 11.5px; font-style: italic; color: #6b4f2c; margin-top: 2px; }
      .price { font-weight: 700; color: ${s.accent}; }
      .best-pill { background: ${s.accent}; color: ${s.paper}; }
      .footer { text-align: center; margin-top: 24px; font-size: 11px; font-style: italic; }
    `)}</head><body><div class="page"><div class="frame">
      <div class="header">
        <div class="pre">Restaurant</div>
        <h1 class="name">${esc(d.restaurantName)}</h1>
        <div class="tag">${esc(d.tagline)}</div>
        <div class="crest"></div>
      </div>
      <div class="columns">
        ${data_to_two_col(d, s)}
      </div>
      <div class="footer">${esc(d.footnote)}</div>
    </div></div></body></html>
  `,
};

function data_to_two_col(d: MenuData, s: MenuStyle): string {
  return d.sections.map((sec) => `
    <section class="section">
      <h2 class="section-title">${esc(sec.title)}</h2>
      ${sec.items.map((i) => {
        const veg = s.showVegMarkers ? `<span class="${i.is_veg ? "veg" : "nv"}"></span>` : "";
        const price = s.showPrices ? rupee(Number(i.price)) : "";
        const best = i.is_bestseller ? `<span class="best-pill">Best</span>` : "";
        return `
          <div class="item">
            <div class="row1"><span class="iname">${veg}${esc(i.name)} ${best}</span><span class="price">${price}</span></div>
            ${i.description ? `<div class="desc">${esc(i.description)}</div>` : ""}
          </div>
        `;
      }).join("")}
    </section>
  `).join("");
}

const boldStatement: MenuTemplate = {
  id: "bold-statement",
  name: "Bold Statement",
  description: "Massive type, color block header, single column.",
  swatches: ["#FC8019", "#EF4444", "#0EA5E9", "#000000", "#22C55E"],
  fontPairs: [{ heading: "Bebas Neue", body: "Inter" }, { heading: "Anton", body: "Inter" }],
  defaultStyle: {
    accent: "#FC8019", ink: "#1C1C1E", paper: "#FFFFFF",
    fontHeading: "Bebas Neue", fontBody: "Inter",
    pageSize: "A4", showPrices: true, showVegMarkers: true,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .hero { background: ${s.accent}; color: white; padding: 56px 64px 80px; }
      .pre { font-size: 12px; letter-spacing: 0.5em; opacity: 0.85; }
      .name { font-size: 92px; line-height: 0.92; letter-spacing: 0.02em; margin-top: 8px; }
      .tag { margin-top: 12px; font-size: 16px; opacity: 0.9; max-width: 420px; }
      .body { padding: 40px 64px; }
      .section { margin-bottom: 28px; page-break-inside: avoid; }
      .section-title { font-size: 36px; letter-spacing: 0.08em; border-bottom: 4px solid ${s.accent}; padding-bottom: 6px; margin-bottom: 14px; }
      .item { display: flex; align-items: baseline; padding: 10px 0; gap: 10px; border-bottom: 1px solid #f0f0f0; }
      .left { flex: 1; }
      .row1 { font-size: 16px; font-weight: 700; }
      .desc { font-size: 12.5px; color: #5b5b5b; margin-top: 2px; }
      .price { font-size: 18px; font-weight: 700; color: ${s.accent}; }
      .best-pill { background: black; color: white; }
      .footer { padding: 0 64px 40px; font-size: 11px; color: #8e8e93; }
    `)}</head><body>
      <div class="hero">
        <div class="pre">— Menu —</div>
        <h1 class="name">${esc(d.restaurantName).toUpperCase()}</h1>
        <div class="tag">${esc(d.tagline)}</div>
      </div>
      <div class="body">
        ${renderSections(d, s, "row")}
      </div>
      <div class="footer">${esc(d.footnote)}</div>
    </body></html>
  `,
};

const cafeChalkboard: MenuTemplate = {
  id: "cafe-chalkboard",
  name: "Café Chalkboard",
  description: "Dark slate background, chalk-style typography.",
  swatches: ["#FFD166", "#EF476F", "#06D6A0", "#FFFFFF", "#FF8C42"],
  fontPairs: [{ heading: "Caveat", body: "Patrick Hand" }, { heading: "Permanent Marker", body: "Patrick Hand" }],
  defaultStyle: {
    accent: "#FFD166", ink: "#F2F2F2", paper: "#1B2826",
    fontHeading: "Caveat", fontBody: "Patrick Hand",
    pageSize: "A4", showPrices: true, showVegMarkers: false,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 56px 64px; background:
        radial-gradient(circle at 20% 10%, #2a3a37 0%, ${s.paper} 60%),
        radial-gradient(circle at 80% 90%, #2a3a37 0%, ${s.paper} 60%); min-height: 96vh; }
      .header { text-align: center; border-bottom: 2px dashed ${s.accent}; padding-bottom: 22px; }
      .name { font-size: 76px; color: ${s.accent}; }
      .tag { font-size: 22px; opacity: 0.8; margin-top: 4px; }
      .section { margin-top: 28px; page-break-inside: avoid; }
      .section-title { font-size: 38px; color: ${s.accent}; }
      .item { padding: 6px 0; }
      .row1 { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 22px; }
      .iname { flex: 1; }
      .price { color: ${s.accent}; font-weight: 700; }
      .desc { font-size: 16px; opacity: 0.7; }
      .best-pill { background: ${s.accent}; color: ${s.paper}; }
      .footer { margin-top: 28px; text-align: center; opacity: 0.6; font-size: 14px; }
    `)}</head><body><div class="page">
      <div class="header">
        <h1 class="name">${esc(d.restaurantName)}</h1>
        <div class="tag">${esc(d.tagline)}</div>
      </div>
      ${renderSections(d, s, "row")}
      <div class="footer">${esc(d.footnote)}</div>
    </div></body></html>
  `,
};

const tropicalCafe: MenuTemplate = {
  id: "tropical-cafe",
  name: "Tropical Café",
  description: "Warm coral and teal with palm-leaf accents.",
  swatches: ["#FF6F61", "#0E9594", "#F4A261", "#264653", "#E76F51"],
  fontPairs: [{ heading: "Pacifico", body: "Quicksand" }, { heading: "Lobster", body: "Quicksand" }],
  defaultStyle: {
    accent: "#0E9594", ink: "#264653", paper: "#FFF8F1",
    fontHeading: "Pacifico", fontBody: "Quicksand",
    pageSize: "A4", showPrices: true, showVegMarkers: true,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 56px 64px; min-height: 96vh; position: relative; }
      .leaf { position: absolute; font-size: 96px; color: ${s.accent}33; }
      .leaf.tl { top: 8px; left: 8px; transform: rotate(-30deg); }
      .leaf.br { bottom: 8px; right: 8px; transform: rotate(150deg); }
      .header { text-align: center; }
      .name { font-size: 64px; color: ${s.accent}; line-height: 1; }
      .tag { font-size: 16px; margin-top: 6px; }
      .ribbon { display: inline-block; background: ${s.accent}; color: ${s.paper}; padding: 6px 18px; border-radius: 999px; margin-top: 12px; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 700; }
      .section { margin-top: 28px; page-break-inside: avoid; }
      .section-title { font-size: 32px; color: ${s.accent}; text-align: center; }
      .item { display: flex; align-items: baseline; padding: 8px 0; gap: 10px; border-bottom: 1px dotted ${s.accent}66; }
      .left { flex: 1; }
      .row1 { font-size: 16px; font-weight: 600; }
      .desc { font-size: 12px; color: #5b5b5b; margin-top: 2px; }
      .price { font-weight: 700; color: ${s.accent}; }
      .best-pill { background: #F4A261; color: white; }
      .footer { margin-top: 28px; text-align: center; font-size: 11px; opacity: 0.7; }
    `)}</head><body><div class="page">
      <div class="leaf tl">🌴</div>
      <div class="leaf br">🌴</div>
      <div class="header">
        <h1 class="name">${esc(d.restaurantName)}</h1>
        <div class="tag">${esc(d.tagline)}</div>
        <div class="ribbon">Today's Menu</div>
      </div>
      ${renderSections(d, s, "row")}
      <div class="footer">${esc(d.footnote)}</div>
    </div></body></html>
  `,
};

const fineDine: MenuTemplate = {
  id: "fine-dine",
  name: "Fine Dine Elegant",
  description: "Charcoal background, gold accents, elegant serif.",
  swatches: ["#D4AF37", "#C0A062", "#A48D4B", "#9A7B4F", "#B5A07A"],
  fontPairs: [{ heading: "Cormorant Garamond", body: "Cormorant Garamond" }, { heading: "Playfair Display", body: "Crimson Text" }],
  defaultStyle: {
    accent: "#D4AF37", ink: "#EFE7D2", paper: "#1A1A1A",
    fontHeading: "Cormorant Garamond", fontBody: "Cormorant Garamond",
    pageSize: "A4", showPrices: true, showVegMarkers: false,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 60px 72px; min-height: 96vh; }
      .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid ${s.accent}66; }
      .pre { font-size: 11px; letter-spacing: 0.6em; color: ${s.accent}; text-transform: uppercase; }
      .name { font-size: 60px; font-weight: 400; letter-spacing: 0.04em; margin-top: 8px; color: ${s.accent}; }
      .tag { font-size: 15px; font-style: italic; margin-top: 8px; opacity: 0.85; }
      .section { margin-top: 32px; page-break-inside: avoid; }
      .section-title { font-size: 24px; letter-spacing: 0.4em; text-transform: uppercase; text-align: center; color: ${s.accent}; margin-bottom: 18px; font-weight: 400; }
      .item { padding: 12px 0; text-align: center; }
      .iname { font-size: 18px; }
      .desc { font-size: 12.5px; opacity: 0.72; margin-top: 4px; font-style: italic; }
      .price { font-size: 14px; color: ${s.accent}; margin-top: 4px; }
      .best-pill { background: transparent; color: ${s.accent}; border: 1px solid ${s.accent}; }
      .footer { margin-top: 32px; text-align: center; font-size: 11px; opacity: 0.6; letter-spacing: 0.2em; }
    `)}</head><body><div class="page">
      <div class="header">
        <div class="pre">— Carte —</div>
        <h1 class="name">${esc(d.restaurantName)}</h1>
        <div class="tag">${esc(d.tagline)}</div>
      </div>
      ${renderSections(d, s, "stacked")}
      <div class="footer">${esc(d.footnote)}</div>
    </div></body></html>
  `,
};

const streetFood: MenuTemplate = {
  id: "street-food",
  name: "Street Food",
  description: "Vibrant sticker-like, bold blocks of colour.",
  swatches: ["#FF3D5A", "#FFD600", "#00BFA6", "#7C4DFF", "#FF6F00"],
  fontPairs: [{ heading: "Fredoka One", body: "Nunito" }, { heading: "Bungee", body: "Nunito" }],
  defaultStyle: {
    accent: "#FF3D5A", ink: "#1A1A1A", paper: "#FFD600",
    fontHeading: "Fredoka One", fontBody: "Nunito",
    pageSize: "A4", showPrices: true, showVegMarkers: true,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 48px; min-height: 96vh; }
      .header { background: white; border: 4px solid ${s.ink}; border-radius: 24px; padding: 24px; text-align: center; box-shadow: 8px 8px 0 ${s.accent}; }
      .name { font-size: 60px; color: ${s.accent}; line-height: 1; }
      .tag { font-size: 16px; margin-top: 4px; font-weight: 700; }
      .section { margin-top: 24px; background: white; border: 4px solid ${s.ink}; border-radius: 20px; padding: 20px 22px; page-break-inside: avoid; }
      .section-title { font-size: 28px; color: ${s.accent}; }
      .item { display: flex; align-items: baseline; padding: 8px 0; gap: 12px; border-bottom: 2px dashed #eee; }
      .item:last-child { border-bottom: 0; }
      .left { flex: 1; }
      .row1 { font-size: 16px; font-weight: 700; }
      .desc { font-size: 12.5px; color: #5b5b5b; margin-top: 2px; }
      .price { background: ${s.accent}; color: white; padding: 4px 10px; border-radius: 999px; font-weight: 700; }
      .best-pill { background: ${s.ink}; color: ${s.paper}; }
      .footer { text-align: center; margin-top: 20px; font-weight: 700; }
    `)}</head><body><div class="page">
      <div class="header">
        <h1 class="name">${esc(d.restaurantName)}</h1>
        <div class="tag">${esc(d.tagline)}</div>
      </div>
      ${renderSections(d, s, "row")}
      <div class="footer">${esc(d.footnote)}</div>
    </div></body></html>
  `,
};

const sushiZen: MenuTemplate = {
  id: "sushi-zen",
  name: "Sushi Zen",
  description: "Minimal Japanese feel, single red accent dot.",
  swatches: ["#BC002D", "#1F1F1F", "#7E6B4E", "#0B5563", "#A0522D"],
  fontPairs: [{ heading: "Noto Serif JP", body: "Inter" }, { heading: "Shippori Mincho", body: "Inter" }],
  defaultStyle: {
    accent: "#BC002D", ink: "#1C1C1E", paper: "#FCFAF5",
    fontHeading: "Noto Serif JP", fontBody: "Inter",
    pageSize: "A4", showPrices: true, showVegMarkers: false,
  },
  render: (d, s) => `
    <!DOCTYPE html><html><head>${head(s, `
      .page { padding: 80px 80px 48px; min-height: 96vh; }
      .dot { width: 64px; height: 64px; border-radius: 50%; background: ${s.accent}; margin-bottom: 28px; }
      .name { font-size: 48px; font-weight: 500; }
      .tag { font-size: 14px; opacity: 0.7; margin-top: 6px; max-width: 380px; }
      .section { margin-top: 36px; page-break-inside: avoid; }
      .section-title { font-size: 20px; font-weight: 500; color: ${s.accent}; padding-bottom: 4px; border-bottom: 1px solid ${s.ink}22; margin-bottom: 16px; }
      .item { display: flex; align-items: baseline; padding: 10px 0; gap: 12px; }
      .left { flex: 1; }
      .row1 { font-size: 15px; font-weight: 500; }
      .desc { font-size: 12px; opacity: 0.65; margin-top: 2px; }
      .price { font-size: 14px; }
      .best-pill { background: ${s.accent}; color: white; }
      .footer { margin-top: 40px; font-size: 10.5px; opacity: 0.5; letter-spacing: 0.3em; text-transform: uppercase; }
    `)}</head><body><div class="page">
      <div class="dot"></div>
      <h1 class="name">${esc(d.restaurantName)}</h1>
      <div class="tag">${esc(d.tagline)}</div>
      ${renderSections(d, s, "row")}
      <div class="footer">${esc(d.footnote)}</div>
    </div></body></html>
  `,
};

export const TEMPLATES: MenuTemplate[] = [
  sleekModern,
  vintageBistro,
  boldStatement,
  cafeChalkboard,
  tropicalCafe,
  fineDine,
  streetFood,
  sushiZen,
];

export function templateById(id: string): MenuTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
