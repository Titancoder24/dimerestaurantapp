// Web-only Google Fonts injection. On native (iOS/Android) the system
// will fall back to the platform serif/sans defined in T.fontDisp etc.
// We don't bundle TTFs here to avoid an asset-pipeline rebuild.

import { Platform } from "react-native";

const HREF =
  "https://fonts.googleapis.com/css2?" +
  "family=Inter:wght@400;500;600;700;800&" +
  "family=IBM+Plex+Mono:wght@400;500;600;700&" +
  "family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&display=swap";

export function ensureWebFonts(): void {
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined") return;
  if (document.getElementById("dime-fonts")) return;
  const link = document.createElement("link");
  link.id = "dime-fonts";
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.id = "dime-fonts-style";
  style.textContent = `
    body, html, #root, #__next { font-family: "Inter", -apple-system, system-ui, sans-serif; }
    /* webkit/firefox feature for tabular numerals */
    .num { font-feature-settings: "tnum"; }
  `;
  document.head.appendChild(style);
}
