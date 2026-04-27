import { Platform } from "react-native";
import type { MenuDesign, CanvasElement, TextElement, MenuListElement, ShapeElement, ImageElement } from "./types";

export type ExportFormat = "png" | "jpeg" | "pdf";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
}

function elToHtml(el: CanvasElement): string {
  const pos = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;z-index:${el.zIndex};`;

  switch (el.type) {
    case "text": {
      const t = el as TextElement;
      const bg = t.backgroundColor ? `background:${t.backgroundColor};` : "";
      return `<div style="${pos}font-size:${t.fontSize}px;font-family:'${t.fontFamily}',sans-serif;font-weight:${t.fontWeight};font-style:${t.fontStyle};color:${t.color};text-align:${t.textAlign};line-height:${t.lineHeight};letter-spacing:${t.letterSpacing}px;text-transform:${t.textTransform};${bg}padding:${t.padding}px;border-radius:${t.borderRadius}px;word-wrap:break-word;white-space:pre-wrap;overflow:hidden;">${esc(t.content)}</div>`;
    }
    case "menu-list": {
      const m = el as MenuListElement;
      const rows = m.items
        .map((it) => {
          const dot =
            m.showVegDots && it.isVeg !== undefined
              ? `<span style="display:inline-block;width:10px;height:10px;border:1.5px solid ${it.isVeg ? "#1f9e57" : "#d63333"};margin-right:6px;vertical-align:middle;"><span style="display:block;width:5px;height:5px;margin:1px auto;border-radius:50%;background:${it.isVeg ? "#1f9e57" : "#d63333"}"></span></span>`
              : "";
          const price = m.showPrices ? `<span style="color:${m.accentColor};font-weight:700;white-space:nowrap;">${esc(it.price)}</span>` : "";
          const desc = it.desc ? `<div style="font-size:${m.fontSize - 2}px;opacity:0.6;margin-top:2px;">${esc(it.desc)}</div>` : "";
          const style = m.listStyle === "bordered" ? "border-bottom:1px solid rgba(0,0,0,0.08);padding-bottom:8px;" : "";
          return `<div style="margin-bottom:${m.itemSpacing}px;${style}"><div style="display:flex;justify-content:space-between;align-items:baseline;">${dot}<span style="flex:1;font-weight:600;">${esc(it.name)}</span>${m.listStyle === "dotted" ? '<span style="flex:1;border-bottom:1px dotted rgba(0,0,0,0.2);margin:0 8px;min-width:20px;"></span>' : ""}${price}</div>${desc}</div>`;
        })
        .join("");
      return `<div style="${pos}font-size:${m.fontSize}px;font-family:'${m.fontFamily}',sans-serif;color:${m.color};overflow:hidden;">${rows}</div>`;
    }
    case "shape": {
      const s = el as ShapeElement;
      const radius = s.shape === "circle" ? "border-radius:50%;" : `border-radius:${s.borderRadius}px;`;
      return `<div style="${pos}${radius}background:${s.fill};border:${s.strokeWidth}px solid ${s.stroke};"></div>`;
    }
    case "image": {
      const img = el as ImageElement;
      if (!img.url) return `<div style="${pos}background:#f0f0f0;border-radius:${img.borderRadius}px;"></div>`;
      return `<div style="${pos}border-radius:${img.borderRadius}px;overflow:hidden;opacity:${img.opacity};"><img src="${img.url}" style="width:100%;height:100%;object-fit:${img.fit};" crossorigin="anonymous" /></div>`;
    }
    default:
      return "";
  }
}

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:wght@400;600;700&family=Bebas+Neue&family=Lora:ital,wght@0,400;0,700;1,400&family=Poppins:wght@400;600;700&family=Caveat:wght@400;700&family=Montserrat:wght@400;600;700;800&family=Merriweather:wght@400;700&family=Quicksand:wght@400;600;700&family=Pacifico&family=Raleway:wght@400;600;700&family=Nunito:wght@400;600;700&family=DM+Sans:wght@400;500;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap";

function toHtml(design: MenuDesign): string {
  const bg = design.backgroundImage
    ? `<div style="position:absolute;inset:0;background-image:url('${design.backgroundImage}');background-size:cover;opacity:${design.backgroundOpacity};"></div>`
    : "";
  const els = [...design.elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(elToHtml)
    .join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><link href="${FONT_LINK}" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body><div style="position:relative;width:${design.canvasWidth}px;height:${design.canvasHeight}px;background:${design.backgroundColor};overflow:hidden;">${bg}${els}</div></body></html>`;
}

export async function exportDesign(
  design: MenuDesign,
  format: ExportFormat,
  filename: string,
): Promise<void> {
  if (Platform.OS !== "web") throw new Error("Export is supported on web only");

  const html = toHtml(design);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;left:-9999px;width:${design.canvasWidth}px;height:${design.canvasHeight}px;border:none;`;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((r) => setTimeout(r, 1200));

    const mod = require("html2canvas") as { default?: Function } | Function;
    const h2c = typeof mod === "function" ? mod : (mod as { default: Function }).default;
    const target = doc.body.firstElementChild as HTMLElement;
    if (!target) throw new Error("Render failed — empty canvas");
    const canvas: HTMLCanvasElement = await h2c(target, {
      width: design.canvasWidth,
      height: design.canvasHeight,
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });

    if (format === "pdf") {
      const dataUrl = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) throw new Error("Pop-ups blocked — allow pop-ups and try again");
      win.document.write(
        `<html><head><title>${filename}</title></head><body style="margin:0;display:flex;justify-content:center;"><img src="${dataUrl}" style="max-width:100%;height:auto;" /></body></html>`,
      );
      win.document.close();
      setTimeout(() => win.print(), 600);
    } else {
      const mime = format === "png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = `${filename}.${format}`;
          a.href = url;
          a.click();
          URL.revokeObjectURL(url);
        },
        mime,
        0.95,
      );
    }
  } finally {
    document.body.removeChild(iframe);
  }
}
