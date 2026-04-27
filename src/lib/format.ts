import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export function rupees(n: number | null | undefined): string {
  if (n == null) return "₹0";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function rupeesPrecise(n: number | null | undefined): string {
  if (n == null) return "₹0.00";
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function shortDate(d: string | Date): string {
  return dayjs(d).format("DD MMM");
}

export function fullDate(d: string | Date): string {
  return dayjs(d).format("DD MMM YYYY");
}

export function time12(t: string): string {
  // Accepts "HH:MM" or "HH:MM:SS"
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  const hr = h ?? 0;
  const min = m ?? 0;
  const suffix = hr >= 12 ? "PM" : "AM";
  const disp = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${disp}:${min.toString().padStart(2, "0")} ${suffix}`;
}

export function timeAgo(d: string | Date): string {
  return dayjs(d).fromNow();
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 4 || h >= 22) return "Hello";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : plural ?? singular + "s"}`;
}
